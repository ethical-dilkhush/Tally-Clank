"use client"

import { useState, useEffect, useRef } from "react"
import { Check, Copy, ExternalLink, Send, BarChart3, Users, X, Clock, RefreshCw, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface TokenDetailsProps {
  token: {
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
    createdAt?: string | number
    requestor_fid?: string
    warpcast_username?: string
    warpcast_display_name?: string
    warpcast_profile?: string
    warpcast_pfp_url?: string
    warpcast_follower_count?: number
    warpcast_following_count?: number
  }
  isOpen: boolean
  onClose: () => void
}

interface DexScreenerData {
  mainPair: {
    name: string
    symbol: string
    price: number
    priceChange24h: number
    volume24h: number
    liquidity: number
    fdv: number
    marketCap: number
    pairAddress: string
    dexId: string
    chainId: string
    url: string
    baseToken: {
      address: string
      name: string
      symbol: string
    }
    quoteToken: {
      address: string
      name: string
      symbol: string
    }
    pairCreatedAt: string
    updatedAt: string
  } | null
  allPairs: any[]
  totalPairs: number
  error?: string
  message?: string
}

export default function TokenDetailsDialog({ token, isOpen, onClose }: TokenDetailsProps) {
  const [copied, setCopied] = useState(false)
  const [contractAddress, setContractAddress] = useState("")
  const [imageError, setImageError] = useState(false)
  const [warpcastPfpError, setWarpcastPfpError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [dexData, setDexData] = useState<DexScreenerData | null>(null)
  const [loadingDexData, setLoadingDexData] = useState(false)
  const [dexDataError, setDexDataError] = useState<string | null>(null)
  const dexDataIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Update contract address when token changes
  useEffect(() => {
    if (token && token.contractAddress) {
      setContractAddress(token.contractAddress)
    } else {
      setContractAddress("0x0000000000000000000000000000000000000000")
    }

    // Reset image error states when token changes
    setImageError(false)
    setWarpcastPfpError(false)

    // Reset DexScreener data
    setDexData(null)
    setDexDataError(null)

    // Fetch DexScreener data when token changes and dialog is open
    if (isOpen && token.contractAddress && token.contractAddress !== "0x0000000000000000000000000000000000000000") {
      fetchDexScreenerData(token.contractAddress, token.blockchain || "ethereum")

      // Set up interval for real-time updates
      if (dexDataIntervalRef.current) {
        clearInterval(dexDataIntervalRef.current)
      }

      dexDataIntervalRef.current = setInterval(() => {
        if (token.contractAddress) {
          fetchDexScreenerData(token.contractAddress, token.blockchain || "ethereum", false)
        }
      }, 30000) // Update every 30 seconds
    }

    // Clean up interval when dialog closes or token changes
    return () => {
      if (dexDataIntervalRef.current) {
        clearInterval(dexDataIntervalRef.current)
        dexDataIntervalRef.current = null
      }
    }
  }, [token, isOpen])

  // Fetch DexScreener data
  const fetchDexScreenerData = async (address: string, chain: string, showLoading = true) => {
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      return
    }

    try {
      if (showLoading) {
        setLoadingDexData(true)
        setDexDataError(null)
      }

      // Map blockchain name to DexScreener chainId
      const chainId = mapBlockchainToDexScreenerChainId(chain)

      const response = await fetch(`/api/dexscreener?chainId=${chainId}&tokenAddress=${address}&_t=${Date.now()}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        console.warn("DexScreener API returned an error:", data.error)
        setDexDataError(data.error)
        setDexData(null)
        return
      }

      // Validate the data structure before using it
      if (data && typeof data === "object") {
        setDexData(data)
        setDexDataError(null)
      } else {
        console.warn("Unexpected data format from DexScreener API:", data)
        setDexDataError("Received invalid data format from DexScreener")
        setDexData(null)
      }
    } catch (err) {
      console.error("Error fetching DexScreener data:", err)
      setDexDataError(err instanceof Error ? err.message : "Failed to fetch token data")
      setDexData(null)
    } finally {
      if (showLoading) {
        setLoadingDexData(false)
      }
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

  // Default values for potentially missing properties
  const {
    name = "Unknown Token",
    symbol = "???",
    price = 0,
    marketCap = 0,
    volume = 0,
    change24h = 0,
    imageUrl = "",
    img_url = "",
    cast_hash = "",
    blockchain = "Ethereum",
    totalSupply = 0,
    circulatingSupply = 0,
    description = "No description available.",
    website = "",
    explorer = "",
    createdAt,
    warpcast_username = "",
    warpcast_display_name = "",
    warpcast_profile = "",
    warpcast_pfp_url = "",
    warpcast_follower_count = 0,
    warpcast_following_count = 0,
  } = token

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

  const displayLiquidity =
    dexData?.mainPair?.liquidity !== undefined && !isNaN(dexData.mainPair.liquidity) ? dexData.mainPair.liquidity : 0

  const displayFdv = dexData?.mainPair?.fdv !== undefined && !isNaN(dexData.mainPair.fdv) ? dexData.mainPair.fdv : 0
  const displayDexId = dexData?.mainPair?.dexId ?? ""
  const displayPairAddress = dexData?.mainPair?.pairAddress ?? ""
  const displayDexUrl = dexData?.mainPair?.url ?? ""

  // Determine which image URL to use (prioritize img_url if available)
  const displayImageUrl = img_url || imageUrl

  // Ensure numeric values are actually numbers
  const safePrice = typeof displayPrice === "number" ? displayPrice : 0
  const safeMarketCap = typeof displayMarketCap === "number" ? displayMarketCap : 0
  const safeVolume = typeof displayVolume === "number" ? displayVolume : 0
  const safeChange24h = typeof displayChange24h === "number" ? displayChange24h : 0
  const safeLiquidity = typeof displayLiquidity === "number" ? displayLiquidity : 0
  const safeFdv = typeof displayFdv === "number" ? displayFdv : 0
  const safeFollowerCount = typeof warpcast_follower_count === "number" ? warpcast_follower_count : 0
  const safeFollowingCount = typeof warpcast_following_count === "number" ? warpcast_following_count : 0

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

  // Update the formatLargeNumber function to include the $ sign
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const openDexScreener = (address: string) => {
    // Use DexScreener URL from API if available
    if (displayDexUrl) {
      window.open(displayDexUrl, "_blank")
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
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (isMobileDevice) {
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

  const openWarpcast = () => {
    if (warpcast_username) {
      window.open(`https://warpcast.com/${warpcast_username}`, "_blank")
    }
  }

  // Generate a placeholder image based on the token symbol
  const generatePlaceholderImage = () => {
    const colors = [
      "bg-gradient-to-br from-blue-400 to-blue-600",
      "bg-gradient-to-br from-green-400 to-green-600",
      "bg-gradient-to-br from-purple-400 to-purple-600",
      "bg-gradient-to-br from-pink-400 to-pink-600",
      "bg-gradient-to-br from-yellow-400 to-yellow-600",
      "bg-gradient-to-br from-red-400 to-red-600",
      "bg-gradient-to-br from-indigo-400 to-indigo-600",
      "bg-gradient-to-br from-orange-400 to-orange-600",
      "bg-gradient-to-br from-teal-400 to-teal-600",
    ]

    // Use the first character of the symbol to determine the color
    const colorIndex = symbol.charCodeAt(0) % colors.length
    const bgColor = colors[colorIndex]

    return (
      <div className={`flex h-full w-full items-center justify-center ${bgColor} text-white text-lg font-bold`}>
        {symbol.substring(0, 2).toUpperCase()}
      </div>
    )
  }

  // Generate a placeholder for Warpcast profile picture
  const generateWarpcastPlaceholder = () => {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#8a63d2] text-white text-lg font-bold">
        {warpcast_display_name ? warpcast_display_name.charAt(0).toUpperCase() : "W"}
      </div>
    )
  }

  // Format creation time
  const formatCreationTime = (createdAt: string | number | undefined) => {
    if (!createdAt) return "Unknown"

    let date: Date

    if (typeof createdAt === "string") {
      // Try to parse the string date
      date = new Date(createdAt)
    } else if (typeof createdAt === "number") {
      // If it's a timestamp
      date = new Date(createdAt)
    } else {
      return "Unknown"
    }

    // Check if date is valid
    if (isNaN(date.getTime())) return "Unknown"

    const now = new Date()
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
  }

  const isPositiveChange = safeChange24h >= 0

  // Add this function to check if a string is a valid URL
  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  // Format follower/following counts
  const formatCount = (count: number) => {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M`
    } else if (count >= 1_000) {
      return `${(count / 1_000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-card/95 backdrop-blur-sm border-card-border">
        <DialogTitle className="sr-only">
          {token.name} ({token.symbol}) Details
        </DialogTitle>

        {/* Close Button */}
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-20">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto h-[80vh] hide-scrollbar">
          {/* Token Header with Image and Name */}
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-card-border p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-lg bg-muted ring-2 ring-card-border flex-shrink-0">
                {displayImageUrl && !imageError ? (
                  <img
                    src={displayImageUrl || "/placeholder.svg"}
                    alt={`${name} logo`}
                    className="h-full w-full object-cover"
                    onError={() => {
                      setImageError(true)
                    }}
                  />
                ) : (
                  generatePlaceholderImage()
                )}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold break-words">{name}</h2>
                <p className="text-base text-muted-foreground">({symbol})</p>
                {/* Add creation time */}
                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Created: {formatCreationTime(createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
            {/* Market Cap and Change */}
            <div className="flex justify-between items-center bg-card/60 rounded-xl p-3 sm:p-4 border border-card-border">
              <div>
                <span className="text-sm text-muted-foreground">Market Cap</span>
                <div className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  {formatLargeNumber(safeMarketCap)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">24h Change</span>
                <div
                  className={`text-lg sm:text-xl font-medium ${isPositiveChange ? "text-green-500" : "text-red-500"}`}
                >
                  {isPositiveChange ? "+" : ""}
                  {safeChange24h.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Action Buttons - Always visible at top for easy access */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button
                className="bg-gradient-to-r from-[#ff007a] to-[#d15aa9] hover:opacity-90 text-white button-hover-effect text-sm sm:text-base py-2 sm:py-3 h-auto"
                onClick={() => openDexScreener(contractAddress)}
              >
                <BarChart3 className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> DexScreener
              </Button>
              <Button
                className="bg-[#0088cc] hover:bg-[#0077b5] text-white button-hover-effect text-sm sm:text-base py-2 sm:py-3 h-auto"
                onClick={sendToTelegram}
              >
                <Send className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> Telegram
              </Button>
            </div>

            {/* Contract Address Section */}
            <div className="rounded-xl border border-card-border bg-card/60 p-3 sm:p-4">
              <h3 className="mb-2 font-medium text-base sm:text-lg">Contract Address</h3>
              <div className="flex items-center justify-between gap-2 rounded-md bg-background/80 p-2 sm:p-3">
                <span className="font-mono text-xs sm:text-sm break-all mr-2">{contractAddress}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(contractAddress)}
                  className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Network: {blockchain}</span>
                {explorer && (
                  <a
                    href={explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    View Explorer <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* DexScreener Data Section */}
            <div className="rounded-xl border border-card-border bg-card/60 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-base sm:text-lg">DexScreener Data</h3>
                <div className="flex items-center gap-2">
                  {loadingDexData && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDexScreenerData(contractAddress, blockchain, true)}
                    disabled={loadingDexData}
                    className="h-7 text-xs"
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {loadingDexData && !dexData ? (
                <div className="flex justify-center items-center py-4">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary mr-2" />
                  <span>Loading DexScreener data...</span>
                </div>
              ) : dexDataError ? (
                <div className="flex items-center gap-2 text-sm text-red-500 p-3 bg-red-500/10 rounded-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{dexDataError}</span>
                </div>
              ) : dexData?.message ? (
                <div className="text-center py-3 text-sm text-muted-foreground">{dexData.message}</div>
              ) : dexData?.mainPair ? (
                <div className="space-y-3">
                  {/* DEX Info */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">DEX: {displayDexId || "Unknown"}</span>
                    {displayDexUrl && (
                      <a
                        href={displayDexUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        View Pair <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {/* Pair Address */}
                  {displayPairAddress && (
                    <div className="text-xs bg-background/80 p-2 rounded-md">
                      <span className="text-muted-foreground mr-1">Pair:</span>
                      <span className="font-mono">{displayPairAddress.substring(0, 18)}...</span>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background/80 p-2 rounded-md">
                      <span className="text-xs text-muted-foreground">Liquidity:</span>
                      <p className="text-sm font-medium">{formatLargeNumber(safeLiquidity)}</p>
                    </div>
                    <div className="bg-background/80 p-2 rounded-md">
                      <span className="text-xs text-muted-foreground">FDV:</span>
                      <p className="text-sm font-medium">{formatLargeNumber(safeFdv)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-sm text-muted-foreground">No DexScreener data available</div>
              )}
            </div>

            {/* Token Stats - Card Style */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-xl border border-card-border bg-card/60 p-3 flex flex-col">
                <h3 className="text-xs sm:text-sm text-muted-foreground">Price</h3>
                <p className="text-sm sm:text-base font-medium">
                  {safePrice === 0 ? "$0.00" : formatCurrency(safePrice)}
                </p>
              </div>
              <div className="rounded-xl border border-card-border bg-card/60 p-3 flex flex-col">
                <h3 className="text-xs sm:text-sm text-muted-foreground">Volume (24h)</h3>
                <p className="text-sm sm:text-base font-medium">{formatLargeNumber(safeVolume)}</p>
              </div>
            </div>

            {/* Warpcast Profile Information */}
            {warpcast_username && (
              <div className="rounded-xl border border-card-border bg-card/60 p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-base sm:text-lg">Warpcast Profile</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openWarpcast}
                    className="h-8 text-xs sm:text-sm text-[#8a63d2] hover:text-[#7a53c2] hover:bg-[#8a63d2]/10"
                  >
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-kOwltd4rhMW0svy9IIsyJnsr8fonsE.png"
                      alt="Warpcast"
                      className="h-4 w-4 sm:h-5 sm:w-5 mr-1"
                    />
                    View Profile
                  </Button>
                </div>

                <div className="flex items-center gap-3 rounded-md bg-background/80 p-2 sm:p-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                    {warpcast_pfp_url && !warpcastPfpError ? (
                      <img
                        src={warpcast_pfp_url || "/placeholder.svg"}
                        alt={`${warpcast_display_name || warpcast_username} profile`}
                        className="h-full w-full object-cover"
                        onError={() => {
                          setWarpcastPfpError(true)
                        }}
                      />
                    ) : (
                      generateWarpcastPlaceholder()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">
                      {warpcast_display_name || `@${warpcast_username}`}
                    </p>
                    {warpcast_display_name && (
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">@{warpcast_username}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          <strong>{formatCount(safeFollowerCount)}</strong> Followers
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          <strong>{formatCount(safeFollowingCount)}</strong> Following
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {warpcast_profile && (
                  <div className="mt-2 p-2 sm:p-3 rounded-md bg-background/80 text-xs sm:text-sm text-muted-foreground">
                    {warpcast_profile}
                  </div>
                )}
              </div>
            )}

            {/* Deployer Information */}
            {cast_hash && (
              <div className="rounded-xl border border-card-border bg-card/60 p-3 sm:p-4">
                <h3 className="mb-2 font-medium text-base sm:text-lg">Deployer</h3>
                <div className="rounded-md bg-background/80 p-2 sm:p-3 text-xs sm:text-sm">
                  {isValidUrl(cast_hash) ? (
                    <a
                      href={cast_hash}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center break-all"
                    >
                      <span className="overflow-hidden text-ellipsis">{cast_hash}</span>
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="font-mono overflow-hidden text-ellipsis break-all">{cast_hash}</span>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {description && (
              <div className="rounded-xl border border-card-border bg-card/60 p-3 sm:p-4">
                <h3 className="mb-2 font-medium text-base sm:text-lg">About {name}</h3>
                <p className="text-xs sm:text-sm">{description}</p>
              </div>
            )}

            {/* Website */}
            {website && (
              <div className="flex justify-center pt-1">
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 sm:gap-2 text-white bg-primary hover:bg-primary/90 rounded-lg py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base w-full sm:w-auto"
                >
                  Visit Website <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
