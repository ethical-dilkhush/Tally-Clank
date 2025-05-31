"use client"
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
  totalSupply?: number
  circulatingSupply?: number
  description?: string
  website?: string
  explorer?: string
  createdAt?: string | number
  [key: string]: any
}

interface WatchListTabProps {
  onTokenClick: (token: Token) => void
  wishlistedTokens: Token[]
  onWishlistToggle: (token: Token) => void
}

export default function WatchListTab({ onTokenClick, wishlistedTokens, onWishlistToggle }: WatchListTabProps) {
  return (
    <div className="space-y-6">
      <div className="relative">
        <h2 className="text-2xl font-semibold mb-6">Watch List</h2>
        <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      </div>

      {wishlistedTokens.length === 0 ? (
        <div className="text-center py-10 backdrop-blur-sm bg-card/60 border border-card-border rounded-lg">
          <p className="text-muted-foreground">No tokens in your watch list</p>
          <p className="text-xs text-muted-foreground mt-2">
            Click the star icon on any token card to add it to your watch list
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistedTokens.map((token) => (
            <TokenCard
              key={`wishlist-${token.id}`}
              token={token}
              onClick={onTokenClick}
              isWishlisted={true}
              onWishlistToggle={onWishlistToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
