"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import TokenCard from "@/components/token-card"

interface Token {
  id: string
  name: string
  symbol: string
  price: number
  marketCap: number
  volume: number
  change24h: number
  imageUrl: string
  contractAddress?: string
  blockchain?: string
  createdAt?: string | number
  [key: string]: any
}

interface SavedToken {
  name: string
  ticker: string
  id: string
}

interface AutoBuyTabProps {
  tokens: Token[]
  onTokenClick: (token: Token) => void
}

export default function AutoBuyTab({ tokens: initialTokens, onTokenClick }: AutoBuyTabProps) {
  const [savedTokens, setSavedTokens] = useState<SavedToken[]>([])
  const [tokenName, setTokenName] = useState("")
  const [tokenTicker, setTokenTicker] = useState("")
  const [detectedTokens, setDetectedTokens] = useState<Token[]>([])
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [allTokens, setAllTokens] = useState<Token[]>(initialTokens || [])
  const [apiError, setApiError] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const errorCountRef = useRef(0)

  // Load saved tokens from localStorage on component mount
  useEffect(() => {
    const savedTokensData = localStorage.getItem("savedTokens")
    if (savedTokensData) {
      try {
        const parsedTokens = JSON.parse(savedTokensData)
        if (Array.isArray(parsedTokens)) {
          setSavedTokens(parsedTokens)
        }
      } catch (err) {
        console.error("Error parsing saved tokens:", err)
      }
    }
  }, [])

  // Set up polling only when there are saved tokens to monitor
  useEffect(() => {
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    // Only start polling if there are saved tokens to monitor
    if (savedTokens.length > 0) {
      console.log(`🔄 Auto-buy: Starting token monitoring for ${savedTokens.length} saved tokens`)
      
      // Initial fetch
      fetchTokens()

      // Set up polling interval with progressive backoff on errors
      const startPolling = () => {
        // Calculate interval based on error count (progressive backoff)
        const baseInterval = 5000 // 5 seconds
        const maxInterval = 60000 // 1 minute max
        const interval = Math.min(baseInterval * Math.pow(2, errorCountRef.current), maxInterval)
        
        pollingIntervalRef.current = setInterval(() => {
          fetchTokens()
        }, interval)
        
        console.log(`Auto-buy polling started with ${interval/1000}s interval`)
      }
      
      startPolling()
    } else {
      console.log(`⏸️ Auto-buy: No saved tokens to monitor, polling stopped`)
      // Clear any existing data when no tokens are saved
      setAllTokens([])
      setDetectedTokens([])
      setApiError(null)
      errorCountRef.current = 0
    }

    // Clean up interval on component unmount or when savedTokens changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [savedTokens.length]) // Dependency on savedTokens.length to restart polling when tokens are added/removed

  // Save tokens to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem("savedTokens", JSON.stringify(savedTokens))
  }, [savedTokens])

  // Fetch tokens directly from the API
  const fetchTokens = async () => {
    // Don't fetch if there are no saved tokens to monitor
    if (savedTokens.length === 0) {
      console.log(`⏭️ Auto-buy: No saved tokens to monitor, skipping fetch`)
      return
    }

    try {
      setRefreshing(true)
      const response = await fetch(`/api/tokens?limit=20&_t=${Date.now()}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        // Increment error count
        errorCountRef.current += 1
        
        // Log the specific error for debugging
        console.warn(`API returned ${response.status}: ${response.statusText}`)
        console.warn("API error details:", data)
        
        // Set more specific API error messages based on response
        let errorMessage = `Clanker API unavailable (${response.status})`
        
        if (response.status === 503) {
          errorMessage = "Network error - Unable to connect to token data service"
        } else if (response.status === 504) {
          errorMessage = "Request timeout - Token data service is taking too long to respond"
        } else if (data.error) {
          errorMessage = data.error
        }
        
        setApiError(errorMessage)
        
        // Still process any tokens that might be in the response (graceful degradation)
        if (data.tokens && Array.isArray(data.tokens) && data.tokens.length > 0) {
          const timestampedData = data.tokens.map((token: Token) => ({
            ...token,
            _timestamp: Date.now(),
          }))
          setAllTokens(timestampedData)
          console.log(`⚠️ Auto-buy: API error but got ${timestampedData.length} tokens from cache/fallback`)
        }
        
        return
      }

      // Check if data contains tokens array
      if (data && data.tokens && Array.isArray(data.tokens)) {
        // Add a timestamp to each token
        const timestampedData = data.tokens.map((token: Token) => ({
          ...token,
          _timestamp: Date.now(),
        }))

        setAllTokens(timestampedData)
        
        // Reset error count and clear API error on successful fetch
        errorCountRef.current = 0
        setApiError(null)
        
        console.log(`✅ Auto-buy: Successfully fetched ${timestampedData.length} tokens for ${savedTokens.length} saved tokens`)
      } else {
        console.warn("API returned unexpected data format:", data)
        setApiError("API returned unexpected data format")
      }
    } catch (error) {
      // Increment error count
      errorCountRef.current += 1
      
      console.error("Network error fetching tokens:", error)
      
      // Set different error messages based on error type
      let errorMessage = "Network error - Unable to connect to token data service"
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Request timeout - Token data service is not responding"
        } else if (error.message.includes('fetch')) {
          errorMessage = "Network error - Check your internet connection"
        } else {
          errorMessage = `Connection error: ${error.message}`
        }
      }
      
      setApiError(errorMessage)
    } finally {
      setRefreshing(false)
    }
  }

  // Check for token matches whenever tokens or saved tokens are updated
  useEffect(() => {
    if (!allTokens || !Array.isArray(allTokens) || allTokens.length === 0 || savedTokens.length === 0) {
      return
    }

    const matches: Token[] = []

    // Check each token against our saved list
    allTokens.forEach((token) => {
      savedTokens.forEach((savedToken) => {
        // Match by name or ticker (case-insensitive)
        const nameMatch = token.name && savedToken.name && token.name.toLowerCase() === savedToken.name.toLowerCase()

        const tickerMatch =
          token.symbol && savedToken.ticker && token.symbol.toLowerCase() === savedToken.ticker.toLowerCase()

        if (nameMatch || tickerMatch) {
          // Check if we already have this token in our detected list
          const alreadyDetected = matches.some((t) => t.id === token.id)
          if (!alreadyDetected) {
            matches.push(token)
          }
        }
      })
    })

    // Update detected tokens
    setDetectedTokens(matches)
  }, [allTokens, savedTokens])

  const handleSaveToken = () => {
    if (!tokenName.trim() && !tokenTicker.trim()) {
      setError("Please enter a token name or ticker")
      return
    }

    // Check if token is already in the list
    const isDuplicate = savedTokens.some(
      (token) =>
        (tokenName && token.name.toLowerCase() === tokenName.toLowerCase()) ||
        (tokenTicker && token.ticker.toLowerCase() === tokenTicker.toLowerCase()),
    )

    if (isDuplicate) {
      setError("This token is already in your list")
      return
    }

    // Add token to saved list
    const newToken: SavedToken = {
      name: tokenName.trim(),
      ticker: tokenTicker.trim(),
      id: Date.now().toString(),
    }

    setSavedTokens((prev) => [...prev, newToken])
    setTokenName("")
    setTokenTicker("")
    setError("")

    // Force an immediate token fetch to check for matches with the new saved token
    fetchTokens()
  }

  const handleRemoveToken = (id: string) => {
    setSavedTokens((prev) => prev.filter((token) => token.id !== id))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Auto Buy Tokens</h1>
        <p className="text-muted-foreground">
          Monitor specific tokens and get notified when they appear in the market
        </p>
      </div>

      {/* Add Token Section */}
      <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-primary rounded-full"></div>
            <h3 className="text-lg font-semibold">Add Token to Watch List</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="token-name" className="text-sm font-medium text-muted-foreground">
                Token Name
              </label>
              <Input
                id="token-name"
                type="text"
                placeholder="e.g., Ethereum"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                className="border-0 bg-muted/50 focus:bg-background transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="token-ticker" className="text-sm font-medium text-muted-foreground">
                Token Symbol
              </label>
              <Input
                id="token-ticker"
                type="text"
                placeholder="e.g., ETH"
                value={tokenTicker}
                onChange={(e) => setTokenTicker(e.target.value)}
                className="border-0 bg-muted/50 focus:bg-background transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 rounded-lg border-l-4 border-destructive">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleSaveToken}
            className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-lg"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Token
          </Button>
        </div>
      </div>

      {/* Saved Tokens Section */}
      {savedTokens.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold">Your Watch List</h3>
            <span className="text-sm text-muted-foreground">
              ({savedTokens.length} token{savedTokens.length !== 1 ? 's' : ''})
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedTokens.map((token) => (
              <div
                key={token.id}
                className="group p-4 bg-muted/30 hover:bg-muted/50 rounded-xl transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{token.name || "—"}</p>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">
                      {token.ticker || "—"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveToken(token.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected Tokens Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-semibold">Detected Tokens</h3>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full">
              {savedTokens.length > 0 ? (
                <>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    Monitoring {savedTokens.length} token{savedTokens.length !== 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Not monitoring
                  </span>
                </>
              )}
            </div>
          </div>

          {savedTokens.length > 0 && (
            <div className="flex items-center gap-2">
              {apiError && (
                <div className="flex items-center gap-1 text-orange-500 text-xs bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                  <AlertCircle className="h-3 w-3" />
                  <span>API Issues</span>
                </div>
              )}
              <div className="relative">
                <RefreshCw className={`h-4 w-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
                {refreshing && <span className="absolute inset-0 rounded-full animate-ping bg-primary/20"></span>}
              </div>
            </div>
          )}
        </div>

        {/* API Error Message - Only show when monitoring tokens */}
        {apiError && savedTokens.length > 0 && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border-l-4 border-orange-500">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  Connection Issue
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  {apiError}
                </p>
                <div className="text-xs text-orange-500 dark:text-orange-400 mt-2 space-y-1">
                  <p>
                    Token detection may be temporarily unavailable. The system will automatically retry
                    {errorCountRef.current > 0 && (
                      <span className="ml-1 font-medium">
                        (Retry interval: {Math.min(5 * Math.pow(2, errorCountRef.current), 60)}s)
                      </span>
                    )}
                  </p>
                  {errorCountRef.current > 2 && (
                    <p className="text-orange-600 dark:text-orange-300 font-medium">
                      Multiple connection attempts failed. Please check your internet connection or try again later.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {detectedTokens.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-2xl">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium text-foreground">
                {savedTokens.length === 0 
                  ? "No tokens being monitored" 
                  : apiError 
                  ? "Token detection temporarily unavailable" 
                  : "No matching tokens detected yet"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {savedTokens.length === 0 
                  ? "Add tokens to your watch list above to start monitoring for new matches"
                  : apiError 
                  ? "Please wait while we reconnect to the token data service" 
                  : "Tokens matching your saved list will appear here when they are detected"
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {detectedTokens.map((token) => (
              <div key={token.id} className="relative group">
                <div className="transform transition-all duration-200 hover:scale-105">
                  <TokenCard token={token} onClick={onTokenClick} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
