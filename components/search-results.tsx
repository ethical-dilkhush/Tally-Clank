"use client"

import { memo } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  contractAddress?: string
  blockchain?: string
  totalSupply?: number
  circulatingSupply?: number
  description?: string
  website?: string
  explorer?: string
}

interface SearchResultsProps {
  searchQuery: string
  searchResults: Token[] | null
  searching: boolean
  onClearSearch: () => void
  onTokenClick: (token: Token) => void
  wishlistedTokens?: Token[]
  onWishlistToggle?: (token: Token) => void
}

// Using memo to prevent re-renders when parent component updates
const SearchResults = memo(function SearchResults({
  searchQuery,
  searchResults,
  searching,
  onClearSearch,
  onTokenClick,
  wishlistedTokens = [],
  onWishlistToggle,
}: SearchResultsProps) {
  if (!searchResults && !searching) return null

  const safeSearchResults = Array.isArray(searchResults) ? searchResults : []
  const showNoSearchResults = safeSearchResults.length === 0 && !searching

  // Function to check if a token is wishlisted
  const isTokenWishlisted = (tokenId: string) => {
    return wishlistedTokens.some((token) => token.id === tokenId)
  }

  return (
    <div className="mb-10 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <h2 className="text-2xl font-semibold">Search Results: {searchQuery}</h2>
          <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSearch}
            className="backdrop-blur-sm bg-card/60 border-card-border"
          >
            <X className="h-4 w-4 mr-2" /> Clear Search
          </Button>
        </div>
      </div>

      {searching ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`search-skeleton-${index}`}
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
          ))}
        </div>
      ) : showNoSearchResults ? (
        <div className="text-center py-10 border border-card-border rounded-lg backdrop-blur-sm bg-card/60">
          <p className="text-muted-foreground">No tokens found matching "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {safeSearchResults.map((token) => (
            <TokenCard
              key={`search-${token.id}`}
              token={token}
              onClick={onTokenClick}
              isWishlisted={isTokenWishlisted(token.id)}
              onWishlistToggle={onWishlistToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
})

export default SearchResults
