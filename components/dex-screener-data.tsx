"use client"

import { useState, useEffect } from "react"
import { RefreshCw, AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatLargeNumber, mapBlockchainToDexScreenerChainId } from "@/lib/dexscreener-utils"

// Add a better currency formatter for potentially very small values with 8 decimal places
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

interface DexScreenerDataProps {
  contractAddress: string
  blockchain: string
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

export default function DexScreenerData({ contractAddress, blockchain }: DexScreenerDataProps) {
  const [dexData, setDexData] = useState<DexScreenerData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000") {
      fetchDexScreenerData()
    }
  }, [contractAddress, blockchain])

  // Update the fetchDexScreenerData function to better handle errors
  const fetchDexScreenerData = async () => {
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const chainId = mapBlockchainToDexScreenerChainId(blockchain)

      const response = await fetch(
        `/api/dexscreener?chainId=${chainId}&tokenAddress=${contractAddress}&_t=${Date.now()}`,
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        console.warn("DexScreener API returned an error:", data.error)
        throw new Error(data.error)
      }

      // Validate the data structure before using it
      if (data && typeof data === "object") {
        setDexData(data)
      } else {
        console.warn("Unexpected data format from DexScreener API:", data)
        throw new Error("Received invalid data format from DexScreener")
      }
    } catch (err) {
      console.error("Error fetching DexScreener data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch token data")
      setDexData(null)
    } finally {
      setLoading(false)
    }
  }

  const openDexScreener = () => {
    if (dexData?.mainPair?.url) {
      window.open(dexData.mainPair.url, "_blank")
    } else {
      const chainId = mapBlockchainToDexScreenerChainId(blockchain)
      window.open(`https://dexscreener.com/${chainId}/${contractAddress}`, "_blank")
    }
  }

  if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
    return <div className="text-center py-3 text-sm text-muted-foreground">No contract address available</div>
  }

  return (
    <div className="rounded-xl border border-card-border bg-card/60 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-base sm:text-lg">DexScreener Data</h3>
        <div className="flex items-center gap-2">
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
          <Button variant="outline" size="sm" onClick={fetchDexScreenerData} disabled={loading} className="h-7 text-xs">
            Refresh
          </Button>
        </div>
      </div>

      {loading && !dexData ? (
        <div className="flex justify-center items-center py-4">
          <RefreshCw className="h-5 w-5 animate-spin text-primary mr-2" />
          <span>Loading DexScreener data...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-red-500 p-3 bg-red-500/10 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : dexData?.message ? (
        <div className="text-center py-3 text-sm text-muted-foreground">{dexData.message}</div>
      ) : dexData?.mainPair ? (
        <div className="space-y-3">
          {/* DEX Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">DEX: {dexData.mainPair.dexId || "Unknown"}</span>
            {dexData.mainPair.url && (
              <a
                href={dexData.mainPair.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                View Pair <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Pair Address */}
          {dexData.mainPair.pairAddress && (
            <div className="text-xs bg-background/80 p-2 rounded-md">
              <span className="text-muted-foreground mr-1">Pair:</span>
              <span className="font-mono">{dexData.mainPair.pairAddress.substring(0, 18)}...</span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background/80 p-2 rounded-md">
              <span className="text-xs text-muted-foreground">Liquidity:</span>
              <p className="text-sm font-medium">{formatLargeNumber(dexData.mainPair.liquidity || 0)}</p>
            </div>
            <div className="bg-background/80 p-2 rounded-md">
              <span className="text-xs text-muted-foreground">FDV:</span>
              <p className="text-sm font-medium">{formatLargeNumber(dexData.mainPair.fdv || 0)}</p>
            </div>
            <div className="bg-background/80 p-2 rounded-md">
              <span className="text-xs text-muted-foreground">Price:</span>
              <p className="text-sm font-medium">
                {dexData.mainPair.price === 0 ? "$0.00" : formatCurrency(dexData.mainPair.price || 0)}
              </p>
            </div>
            <div className="bg-background/80 p-2 rounded-md">
              <span className="text-xs text-muted-foreground">24h Change:</span>
              <p
                className={`text-sm font-medium ${(dexData.mainPair.priceChange24h || 0) >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {(dexData.mainPair.priceChange24h || 0) >= 0 ? "+" : ""}
                {(dexData.mainPair.priceChange24h || 0).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* View on DexScreener Button */}
          <Button variant="outline" size="sm" onClick={openDexScreener} className="w-full mt-2">
            <ExternalLink className="h-4 w-4 mr-2" />
            View on DexScreener
          </Button>
        </div>
      ) : (
        <div className="text-center py-3 text-sm text-muted-foreground">No DexScreener data available</div>
      )}
    </div>
  )
}
