"use client"

import { memo } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import TokenTable, { type TokenTableToken } from "@/components/token-table"

interface SearchResultsProps {
  searchQuery: string
  searchResults: TokenTableToken[] | null
  searching: boolean
  onClearSearch: () => void
  wishlistedTokens?: TokenTableToken[]
  onWishlistToggle?: (token: TokenTableToken) => void
}

const SearchResults = memo(function SearchResults({
  searchQuery,
  searchResults,
  searching,
  onClearSearch,
  wishlistedTokens = [],
  onWishlistToggle,
}: SearchResultsProps) {
  if (!searchResults && !searching) return null

  const safeSearchResults = Array.isArray(searchResults) ? searchResults : []
  const showNoSearchResults = safeSearchResults.length === 0 && !searching

  return (
    <div className="mb-10 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <h2 className="text-2xl font-semibold">Search Results: {searchQuery}</h2>
          <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSearch}
          className="backdrop-blur-sm bg-card/60 border-card-border"
        >
          <X className="h-4 w-4 mr-2" /> Clear Search
        </Button>
      </div>

      {showNoSearchResults ? (
        <div className="text-center py-10 border border-card-border rounded-xl backdrop-blur-sm bg-card/60">
          <p className="text-muted-foreground">No tokens found matching &quot;{searchQuery}&quot;</p>
        </div>
      ) : (
        <TokenTable
          tokens={safeSearchResults}
          loading={searching}
          wishlistedTokens={wishlistedTokens}
          onWishlistToggle={onWishlistToggle}
        />
      )}
    </div>
  )
})

export default SearchResults
