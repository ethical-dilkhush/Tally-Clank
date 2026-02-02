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

      const response = await fetch('/api/world-chat?limit=100', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        const responseText = await response.text()
        const contentType = response.headers.get('content-type') || ''
        const isJson = contentType.includes('application/json') || /^\s*[\{\[]/.test(responseText.trim())

        let errorData: { error?: string; details?: string; setupRequired?: boolean } | null = null
        if (responseText.trim() && isJson) {
          try {
            errorData = JSON.parse(responseText)
          } catch {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
          }
        } else {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }

        if (errorData && typeof errorData === 'object' && Object.keys(errorData).length === 0) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }

        if (errorData?.setupRequired) {
          throw new Error(`Database Setup Required: ${errorData.details}`)
        }
        throw new Error(errorData?.details || errorData?.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Parse successful response (only parse if body looks like JSON; server may return HTML on error)
      const responseText = await response.text()
      const contentType = response.headers.get('content-type') || ''
      const looksLikeJson = contentType.includes('application/json') || /^\s*[\{\[]/.test(responseText.trim())

      if (!responseText.trim()) {
        throw new Error('Empty response from API')
      }
      if (!looksLikeJson) {
        throw new Error('Server returned an error page instead of JSON. The world-chat API may be misconfigured or unavailable.')
      }

      let data: { messages?: unknown[] } | null = null
      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error('Invalid response format from API')
      }
      if (data && typeof data === 'object' && Object.keys(data).length === 0) {
        throw new Error('API returned empty object')
      }

      const messagesList = data?.messages || []
      setMessages(messagesList)
      
      // Update online users based on recent activity (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const recentUsers = new Set(
        messagesList
          .filter((msg: ChatMessage) => new Date(msg.created_at) > fiveMinutesAgo)
          .map((msg: ChatMessage) => msg.address)
      )
      setOnlineUsers(recentUsers)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages'
      setError(errorMessage)
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

      await response.json()
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
    <div className="w-full max-w-none px-4 space-y-6">
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