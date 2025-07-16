"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Send, 
  Users, 
  Clock,
  Wallet,
  AlertCircle
} from "lucide-react"

interface ChatMessage {
  id: string
  address: string
  message: string
  display_name: string
  created_at: string
}

interface WorldChatTabProps {
  // Add any props if needed
}

export default function WorldChatTab({}: WorldChatTabProps) {
  const { address, isConnected } = useAccount()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch messages from API
  const fetchMessages = useCallback(async () => {
    try {
      setError(null)
      console.log('🔄 Fetching messages from API...')
      console.log('🔄 API URL:', '/api/world-chat?limit=100')
      console.log('🔄 Current time:', new Date().toISOString())
      
      const response = await fetch('/api/world-chat?limit=100', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      console.log('📡 API Response status:', response.status, response.statusText)
      console.log('📡 API Response URL:', response.url)
      console.log('📡 API Response headers:', {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length'),
        'cache-control': response.headers.get('cache-control')
      })

      if (!response.ok) {
        let errorData = null
        try {
          const responseText = await response.text()
          console.log('📄 Raw error response:', responseText)
          console.log('📄 Response length:', responseText.length)
          console.log('📄 Response content type:', response.headers.get('content-type'))
          
          if (responseText.trim()) {
            errorData = JSON.parse(responseText)
            console.log('📄 Parsed error data:', errorData)
            console.log('📄 Error data type:', typeof errorData)
            console.log('📄 Error data keys:', Object.keys(errorData || {}))
          } else {
            console.log('📄 Empty error response body')
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
          }
        } catch (parseError) {
          console.error('❌ Error parsing API response:', parseError)
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        
        // Check if errorData is empty object
        if (errorData && typeof errorData === 'object' && Object.keys(errorData).length === 0) {
          console.log('⚠️ Empty error object detected, creating fallback error')
          errorData = { error: `HTTP ${response.status}: ${response.statusText} (empty error response)` }
        }
        
        console.error('❌ Final processed error data:', errorData)
        
        // Handle specific error cases
        if (errorData && errorData.setupRequired) {
          throw new Error(`Database Setup Required: ${errorData.details}`)
        }
        
        throw new Error(errorData?.details || errorData?.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Parse successful response
      let data = null
      try {
        const responseText = await response.text()
        console.log('📄 Raw success response length:', responseText.length)
        console.log('📄 Success response content type:', response.headers.get('content-type'))
        console.log('📄 Raw success response preview:', responseText.substring(0, 200) + '...')
        
        if (responseText.trim()) {
          data = JSON.parse(responseText)
          console.log('📄 Parsed success data:', data)
          console.log('📄 Success data type:', typeof data)
          console.log('📄 Success data keys:', Object.keys(data || {}))
          
          // Check if it's an empty object
          if (data && typeof data === 'object' && Object.keys(data).length === 0) {
            console.log('⚠️ Empty success object detected')
            throw new Error('API returned empty object')
          }
        } else {
          console.log('📄 Empty success response body')
          throw new Error('Empty response from API')
        }
      } catch (parseError) {
        console.error('❌ Error parsing success response:', parseError)
        console.error('❌ Parse error details:', parseError.message)
        throw new Error('Invalid response format from API')
      }

      console.log('✅ Successfully parsed API response:', { messageCount: data.messages?.length || 0 })
      
      setMessages(data.messages || [])
      
      // Update online users based on recent activity (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const recentUsers = new Set(
        data.messages
          .filter((msg: ChatMessage) => new Date(msg.created_at) > fiveMinutesAgo)
          .map((msg: ChatMessage) => msg.address)
      )
      setOnlineUsers(recentUsers)
      
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages'
      setError(errorMessage)
    } finally {
      // setIsLoading(false) // Removed loading state
    }
  }, [])

  // Set up polling for real-time updates
  useEffect(() => {
    fetchMessages()
    
    // Set up polling interval
    pollingIntervalRef.current = setInterval(fetchMessages, 3000) // Poll every 3 seconds
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [fetchMessages])

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !address || !isConnected) return

    try {
      console.log('📤 Sending message:', { address: address.slice(0, 10) + '...', messageLength: newMessage.trim().length })
      
      const response = await fetch('/api/world-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          message: newMessage.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Send message API error:', errorData)
        
        // Handle specific error cases
        if (errorData.setupRequired) {
          throw new Error(`Database Setup Required: ${errorData.details}`)
        }
        
        throw new Error(errorData.details || errorData.error || 'Failed to send message')
      }

      const result = await response.json()
      console.log('✅ Message sent successfully:', result)
      
      setNewMessage("")
      setError(null) // Clear any previous errors
      
      // Refresh messages immediately after sending
      fetchMessages()
      
    } catch (error) {
      console.error('❌ Error sending message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      setError(errorMessage)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, ChatMessage[]>)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-full p-2">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">World Chat</h1>
            <p className="text-muted-foreground">
              {isConnected 
                ? "Chat with other users using your wallet address"
                : "Connect your wallet to participate in the chat"
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{onlineUsers.size} online</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <span className="text-sm font-medium">
                {error.includes('Database Setup Required') ? 'Database Setup Required' : 'Error'}
              </span>
              <p className="text-sm">{error}</p>
              
              {error.includes('Database Setup Required') && (
                <div className="mt-3 p-3 bg-background/50 rounded border">
                  <p className="text-sm font-medium mb-2">Setup Instructions:</p>
                  <ol className="text-xs space-y-1 list-decimal list-inside">
                    <li>Open your Supabase dashboard</li>
                    <li>Go to the SQL Editor</li>
                    <li>Copy and paste the SQL from <code className="bg-muted px-1 rounded">sql/create_world_chat_table.sql</code></li>
                    <li>Click "Run" to create the table</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Card */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Global Messages</CardTitle>
            <div className="flex items-center gap-2">
              {isConnected && (
                <Badge variant="outline" className="text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Connected as {address?.slice(0, 6)}...{address?.slice(-4)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isConnected ? "Be the first to start the conversation!" : "Connect your wallet to join the conversation!"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    {/* Date separator */}
                    <div className="flex items-center gap-2 my-4">
                      <div className="flex-1 h-px bg-border"></div>
                      <Badge variant="secondary" className="text-xs">
                        {date}
                      </Badge>
                      <div className="flex-1 h-px bg-border"></div>
                    </div>
                    
                    {/* Messages for this date */}
                    {msgs.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${message.address === address?.toLowerCase() ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {message.display_name}
                            </span>
                            {message.address === address?.toLowerCase() && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground break-words">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            {!isConnected ? (
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to send messages
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    maxLength={500}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Press Enter to send</span>
                  <span>{newMessage.length}/500</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 