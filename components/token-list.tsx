"use client"

import { memo } from "react"
import { RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
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
  // Optional properties
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
  [key: string]: any
}

interface TokenListProps {
  tokens: Token[]
  loading: boolean
  refreshing: boolean
  onTokenClick: (token: Token) => void
  wishlistedTokens?: Token[]
  onWishlistToggle?: (token: Token) => void
}

// Using memo to prevent re-renders when parent component updates
const TokenList = memo(function TokenList({
  tokens,
  loading,
  refreshing,
  onTokenClick,
  wishlistedTokens = [],
  onWishlistToggle,
}: TokenListProps) {
  const safeTokens = Array.isArray(tokens) ? tokens : []

  // Function to check if a token is wishlisted
  const isTokenWishlisted = (tokenId: string) => {
    return wishlistedTokens.some((token) => token.id === tokenId)
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <h2 className="text-2xl font-semibold">New Created Tokens</h2>
          <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        </div>
        <div className="flex items-center">
          <div className="relative">
            <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} style={{ animationDuration: "1s" }} />
            {refreshing && <span className="absolute inset-0 rounded-full animate-ping bg-primary/20"></span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          // Show skeletons while loading
          Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`main-skeleton-${index}`}
              className="rounded-lg border border-card-border p-4 backdrop-blur-sm bg-card/60"
            >
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))
        ) : safeTokens.length > 0 ? (
          safeTokens.map((token) => (
            <TokenCard
              key={`main-${token.id}`}
              token={token}
              onClick={onTokenClick}
              isWishlisted={isTokenWishlisted(token.id)}
              onWishlistToggle={onWishlistToggle}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-10 backdrop-blur-sm bg-card/60 border border-card-border rounded-lg">
            <p className="text-muted-foreground">No tokens available</p>
          </div>
        )}
      </div>
    </div>
  )
})

export default TokenList
