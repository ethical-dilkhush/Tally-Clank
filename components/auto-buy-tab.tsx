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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

    // Initial token fetch
    fetchTokens()

    // Set up polling for token updates
    pollingIntervalRef.current = setInterval(() => {
      fetchTokens()
    }, 5000) // Poll every 5 seconds

    // Clean up interval on component unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [])

  // Save tokens to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem("savedTokens", JSON.stringify(savedTokens))
  }, [savedTokens])

  // Fetch tokens directly from the API
  const fetchTokens = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/tokens?limit=50&_t=${Date.now()}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Check if data contains tokens array
      if (data && data.tokens && Array.isArray(data.tokens)) {
        // Add a timestamp to each token
        const timestampedData = data.tokens.map((token: Token) => ({
          ...token,
          _timestamp: Date.now(),
        }))

        setAllTokens(timestampedData)
      }
    } catch (err) {
      console.error("Error fetching tokens for auto detection:", err)
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
    <div className="space-y-6">
      <div className="relative">
        <h2 className="text-2xl font-semibold mb-6">Auto Buy Tokens</h2>
        <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      </div>

      {/* Add token form */}
      <div className="rounded-lg border border-card-border p-4 backdrop-blur-sm bg-card/60">
        <h3 className="text-lg font-medium mb-4">Save Token to Watch List</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="flex-1">
            <label htmlFor="token-name" className="text-sm text-muted-foreground mb-1 block">
              Token Name
            </label>
            <Input
              id="token-name"
              type="text"
              placeholder="Enter token name"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className="w-full bg-background/80"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="token-ticker" className="text-sm text-muted-foreground mb-1 block">
              Token Ticker
            </label>
            <Input
              id="token-ticker"
              type="text"
              placeholder="Enter token ticker"
              value={tokenTicker}
              onChange={(e) => setTokenTicker(e.target.value)}
              className="w-full bg-background/80"
            />
          </div>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-500 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}

        <Button onClick={handleSaveToken} className="bg-primary w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Save Token
        </Button>

        <p className="text-xs text-muted-foreground mt-3">
          Add tokens you want to automatically detect when they are launched. The system will monitor for these tokens
          and alert you when they become available.
        </p>
      </div>

      {/* Saved tokens list */}
      <div className="rounded-lg border border-card-border p-4 backdrop-blur-sm bg-card/60">
        <h3 className="text-lg font-medium mb-4">Saved Tokens</h3>

        {savedTokens.length === 0 ? (
          <div className="text-center py-6 bg-card/40 border border-card-border rounded-lg">
            <p className="text-muted-foreground">No tokens saved yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {savedTokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between p-3 rounded-lg border border-card-border bg-card/40"
              >
                <div>
                  <p className="font-medium">{token.name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{token.ticker || "—"}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveToken(token.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detected tokens section */}
      <div className="rounded-lg border border-card-border p-4 backdrop-blur-sm bg-card/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Detected Tokens</h3>
          <div className="relative">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing && <span className="absolute inset-0 rounded-full animate-ping bg-primary/20"></span>}
          </div>
        </div>

        {detectedTokens.length === 0 ? (
          <div className="text-center py-10 bg-card/40 border border-card-border rounded-lg">
            <p className="text-muted-foreground">No matching tokens detected yet</p>
            <p className="text-xs text-muted-foreground mt-2">
              Tokens matching your saved list will appear here when they are detected
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {detectedTokens.map((token) => (
              <div key={token.id} className="relative group">
                <TokenCard token={token} onClick={onTokenClick} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
