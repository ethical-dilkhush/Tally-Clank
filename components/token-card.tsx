"use client"

import type React from "react"

import { ArrowDownIcon, ArrowUpIcon, BarChart3, Send, Clock, Star } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

interface Token {
  id: string
  name: string
  symbol: string
  price: number
  marketCap: number
  volume: number
  change24h: number
  imageUrl: string
  img_url?: string
  cast_hash?: string
  contractAddress?: string
  blockchain?: string
  totalSupply?: number
  circulatingSupply?: number
  description?: string
  website?: string
  explorer?: string
  requestor_fid?: string
  warpcast_username?: string
  warpcast_display_name?: string
  warpcast_profile?: string
  warpcast_pfp_url?: string
  warpcast_follower_count?: number
  warpcast_following_count?: number
  createdAt?: string | number // Add createdAt field
  rawCreatedAt?: any // Add raw value for debugging
  dexScreenerData?: any // Add field for DexScreener data
}

interface TokenCardProps {
  token: Token
  onClick: (token: Token) => void
  isWishlisted?: boolean
  onWishlistToggle?: (token: Token) => void
}

export default function TokenCard({ token, onClick, isWishlisted, onWishlistToggle }: TokenCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isNew, setIsNew] = useState(true)
  const [dexData, setDexData] = useState<any>(null)
  const [loadingDexData, setLoadingDexData] = useState(false)

  // Effect to handle the "new" state for animation
  useEffect(() => {
    setIsNew(true)
    const timer = setTimeout(() => {
      setIsNew(false)
    }, 500) // Reduced duration of the "new" state for faster transitions

    return () => clearTimeout(timer)
  }, [token.id, token.price]) // Re-trigger when token ID or price changes

  // Fetch DexScreener data if we have a contract address
  useEffect(() => {
    if (token.contractAddress && token.contractAddress !== "0x0000000000000000000000000000000000000000") {
      fetchDexScreenerData(token.contractAddress, token.blockchain || "ethereum")
    }
  }, [token.contractAddress, token.blockchain])

  // Update the fetchDexScreenerData function to better handle errors
  const fetchDexScreenerData = async (address: string, chain: string) => {
    try {
      setLoadingDexData(true)

      // Map blockchain name to DexScreener chainId
      const chainId = mapBlockchainToDexScreenerChainId(chain)

      const response = await fetch(`/api/dexscreener?chainId=${chainId}&tokenAddress=${address}&_t=${Date.now()}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        console.warn("DexScreener API returned an error:", data.error)
        // Don't throw here, just set null data
        setDexData(null)
        return
      }

      // Validate the data structure before using it
      if (data && typeof data === "object") {
        setDexData(data)
      } else {
        console.warn("Unexpected data format from DexScreener API:", data)
        setDexData(null)
      }
    } catch (err) {
      console.error("Error fetching DexScreener data:", err)
      setDexData(null)
    } finally {
      setLoadingDexData(false)
    }
  }

  // Map blockchain name to DexScreener chainId
  const mapBlockchainToDexScreenerChainId = (blockchain: string): string => {
    const chainMap: Record<string, string> = {
      ethereum: "ethereum",
      eth: "ethereum",
      bsc: "bsc",
      binance: "bsc",
      polygon: "polygon",
      matic: "polygon",
      avalanche: "avalanche",
      avax: "avalanche",
      fantom: "fantom",
      ftm: "fantom",
      arbitrum: "arbitrum",
      optimism: "optimism",
      base: "base",
      solana: "solana",
      sol: "solana",
    }

    const normalizedChain = blockchain.toLowerCase()
    return chainMap[normalizedChain] || normalizedChain
  }

  // Update the formatCurrency function to handle very small numbers better with 8 decimal places
  const formatCurrency = (value: number) => {
    // For extremely small values, use scientific notation
    if (value > 0 && value < 0.00000001) {
      return `$${value.toExponential(4)}`
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 1 ? 8 : 2, // Show up to 8 decimals for small values
    }).format(value)
  }

  const formatLargeNumber = (value: number) => {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  const formatCount = (count: number) => {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M`
    } else if (count >= 1_000) {
      return `${(count / 1_000).toFixed(1)}K`
    }
    return count.toString()
  }

  // Format creation time
  const formatCreationTime = (createdAt: string | number | undefined, rawCreatedAt: any = undefined) => {
    // If no creation time is available
    if (!createdAt && !rawCreatedAt) {
      return "Unknown"
    }

    // For debugging, if we have the raw value but no processed value
    if (!createdAt && rawCreatedAt !== undefined) {
      return `Raw: ${JSON.stringify(rawCreatedAt).substring(0, 30)}`
    }

    let date: Date

    try {
      if (typeof createdAt === "string") {
        // Try to parse the string date
        date = new Date(createdAt)
      } else if (typeof createdAt === "number") {
        // If it's a timestamp in milliseconds
        date = new Date(createdAt)
      } else {
        return "Invalid date"
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date"
      }

      // Check if date is in the future (invalid)
      const now = new Date()
      if (date > now) {
        // If date is in the future, cap it to current time
        date = now
      }

      const diffMs = now.getTime() - date.getTime()
      const diffSecs = Math.floor(diffMs / 1000)
      const diffMins = Math.floor(diffSecs / 60)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      // Format relative time
      if (diffSecs < 60) {
        return `${diffSecs}s ago`
      } else if (diffMins < 60) {
        return `${diffMins}m ago`
      } else if (diffHours < 24) {
        return `${diffHours}h ago`
      } else if (diffDays < 30) {
        return `${diffDays}d ago`
      } else {
        // Format as date for older tokens
        return date.toLocaleDateString()
      }
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Date error"
    }
  }

  // Add default values for potentially missing properties
  const {
    name = "Unknown Token",
    symbol = "???",
    price = 0,
    marketCap = 0,
    volume = 0,
    change24h = 0,
    imageUrl = "",
    img_url = "",
    contractAddress = "0x0000000000000000000000000000000000000000",
    blockchain = "Ethereum",
    warpcast_username = "",
    createdAt,
    rawCreatedAt,
  } = token

  // Update the price and other data display to be more defensive
  // Use DexScreener data if available and valid
  const displayPrice =
    dexData?.mainPair?.price !== undefined && !isNaN(dexData.mainPair.price) ? dexData.mainPair.price : price

  const displayMarketCap =
    dexData?.mainPair?.marketCap !== undefined && !isNaN(dexData.mainPair.marketCap)
      ? dexData.mainPair.marketCap
      : marketCap

  const displayVolume =
    dexData?.mainPair?.volume24h !== undefined && !isNaN(dexData.mainPair.volume24h)
      ? dexData.mainPair.volume24h
      : volume

  const displayChange24h =
    dexData?.mainPair?.priceChange24h !== undefined && !isNaN(dexData.mainPair.priceChange24h)
      ? dexData.mainPair.priceChange24h
      : change24h

  // Format the symbol with $ if it doesn't already have one
  const formattedSymbol = symbol.startsWith("$") ? symbol : `${symbol}`

  // Determine which image URL to use (prioritize img_url if available)
  const displayImageUrl = img_url || imageUrl

  // Ensure numeric values are actually numbers
  const safePrice = typeof displayPrice === "number" ? displayPrice : 0
  const safeMarketCap = typeof displayMarketCap === "number" ? displayMarketCap : 0
  const safeVolume = typeof displayVolume === "number" ? displayVolume : 0
  const safeChange24h = typeof displayChange24h === "number" ? displayChange24h : 0

  const isPositiveChange = safeChange24h >= 0

  // Generate a placeholder image based on the token symbol
  const generatePlaceholderImage = () => {
    const colors = [
      "bg-gradient-to-br from-blue-400 to-blue-600",
      "bg-gradient-to-br from-green-400 to-green-600",
      "bg-gradient-to-br from-purple-400 to-purple-600",
      "bg-gradient-to-br from-slate-400 to-slate-600",
      "bg-gradient-to-br from-yellow-400 to-yellow-600",
      "bg-gradient-to-br from-red-400 to-red-600",
      "bg-gradient-to-br from-indigo-400 to-indigo-600",
      "bg-gradient-to-br from-orange-400 to-orange-600",
      "bg-gradient-to-br from-teal-400 to-teal-600",
    ]

    // Use the first character of the symbol to determine the color
    // Remove $ if present for color calculation
    const cleanSymbol = symbol.startsWith("$") ? symbol.substring(1) : symbol
    const colorIndex = cleanSymbol.charCodeAt(0) % colors.length
    const bgColor = colors[colorIndex]

    return (
      <div className={`flex h-full w-full items-center justify-center ${bgColor} text-white text-lg font-bold`}>
        {cleanSymbol.substring(0, 2).toUpperCase()}
      </div>
    )
  }

  const openDexScreener = (address: string) => {
    // Use DexScreener URL from API if available
    if (dexData?.mainPair?.url) {
      window.open(dexData.mainPair.url, "_blank")
      return
    }

    // Otherwise construct URL based on blockchain
    const chainId = mapBlockchainToDexScreenerChainId(blockchain)
    const dexScreenerUrl = `https://dexscreener.com/${chainId}/${address}`
    window.open(dexScreenerUrl, "_blank")
  }

  const sendToTelegram = () => {
    // Create a message with the contract address prominently displayed
    const message = `${name} (${symbol})\n\n📝 Contract Address:\n${contractAddress}\n\n🔗 Blockchain: ${blockchain}\n💰 Price: ${formatCurrency(safePrice)}\n📊 24h Change: ${safeChange24h.toFixed(2)}%`
    const encodedMessage = encodeURIComponent(message)

    // Try multiple approaches to open Telegram

    // 1. Try direct Telegram protocol
    const telegramAppUrl = `tg://msg?text=${encodedMessage}`

    // 2. Fallback to web version
    const telegramWebUrl = `https://t.me/share/url?url=${encodeURIComponent(contractAddress)}&text=${encodedMessage}`

    // Try to detect if on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (isMobile) {
      // On mobile, try to open the app first
      const link = document.createElement("a")
      link.href = telegramAppUrl
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()

      // Set a timeout to try the web version if the app doesn't open
      setTimeout(() => {
        window.location.href = telegramWebUrl
      }, 500)
    } else {
      // On desktop, just open the web version
      window.open(telegramWebUrl, "_blank")
    }
  }

  const openWarpcast = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent token card click
    if (warpcast_username) {
      window.open(`https://warpcast.com/${warpcast_username}`, "_blank")
    }
  }

  // Create a merged token object with DexScreener data
  const handleClick = () => {
    const enrichedToken = {
      ...token,
      dexScreenerData: dexData,
    }
    onClick(enrichedToken)
  }

  return (
    <Card
      className={`group overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm bg-card/80 border-card-border ${
        isNew ? "animate-card-appear shadow-glow" : ""
      }`}
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      {onWishlistToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 bg-background/40 backdrop-blur-sm hover:bg-background/60 z-10"
          onClick={(e) => {
            e.stopPropagation()
            onWishlistToggle(token)
          }}
        >
          <Star className={`h-5 w-5 ${isWishlisted ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
        </Button>
      )}

      <CardHeader className="p-4 pb-0 relative">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-14 w-14 overflow-hidden rounded-lg bg-muted ring-2 ring-card-border ${isNew ? "animate-pulse" : ""}`}
            >
              {displayImageUrl && !imageError ? (
                <img
                  src={displayImageUrl || "/placeholder.svg"}
                  alt={`${name} logo`}
                  className="h-full w-full object-cover"
                  onError={() => {
                    console.log(`Image failed to load: ${displayImageUrl}`)
                    setImageError(true)
                  }}
                />
              ) : (
                generatePlaceholderImage()
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold">{formattedSymbol}</h3>
              <p className="text-base text-muted-foreground">{name}</p>
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                <span>{createdAt ? new Date(createdAt).toLocaleString() : "Unknown"}</span>
              </div>
            </div>
          </div>

          {warpcast_username && (
            <div className="flex items-center gap-3 mt-2">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-kOwltd4rhMW0svy9IIsyJnsr8fonsE.png"
                alt="Warpcast"
                className="h-6 w-6"
              />
              <div className="flex items-center gap-4">
                <a
                  href={`https://warpcast.com/${warpcast_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-lg text-white hover:underline"
                >
                  @{warpcast_username}
                </a>
                {token.warpcast_follower_count !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    <strong>{formatCount(token.warpcast_follower_count || 0)}</strong> followers
                  </span>
                )}
                {token.warpcast_following_count !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    <strong>{formatCount(token.warpcast_following_count || 0)}</strong> following
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 relative z-10">
        <div className="mt-2 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-base text-muted-foreground">Market Cap</span>
            <span className={`text-xl font-bold ${isNew ? "animate-highlight" : ""}`}>
              {formatLargeNumber(safeMarketCap)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-base text-muted-foreground">24h Change</span>
            <div className={`flex items-center gap-1 ${isPositiveChange ? "text-green-500" : "text-red-500"}`}>
              {isPositiveChange ? <ArrowUpIcon className="h-5 w-5" /> : <ArrowDownIcon className="h-5 w-5" />}
              <span className="text-base font-medium">{Math.abs(safeChange24h).toFixed(2)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
            <div>
              <p className="text-base text-muted-foreground">Price</p>
              <p className="text-base font-medium">{safePrice === 0 ? "$0.00" : formatCurrency(safePrice)}</p>
            </div>
            <div>
              <p className="text-base text-muted-foreground">Volume (24h)</p>
              <p className="text-base font-medium">{formatLargeNumber(safeVolume)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3">
            <Button
              size="default"
              className="flex-1 bg-gradient-to-r from-[#ff007a] to-[#d15aa9] hover:opacity-90 text-white text-base"
              onClick={(e) => {
                e.stopPropagation()
                openDexScreener(contractAddress)
              }}
            >
              <BarChart3 className="h-5 w-5 mr-2" /> DEX
            </Button>
            <Button
              size="default"
              className="flex-1 bg-[#0088cc] hover:bg-[#0077b5] text-white text-base"
              onClick={(e) => {
                e.stopPropagation()
                sendToTelegram()
              }}
            >
              <Send className="h-5 w-5 mr-2" /> Telegram
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
