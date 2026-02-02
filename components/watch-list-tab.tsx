"use client"

import TokenTable, { type TokenTableToken } from "@/components/token-table"

interface WatchListTabProps {
  wishlistedTokens: TokenTableToken[]
  onWishlistToggle: (token: TokenTableToken) => void
}

export default function WatchListTab({ wishlistedTokens, onWishlistToggle }: WatchListTabProps) {
  return (
    <div className="space-y-6">
      <div className="relative">
        <h2 className="text-2xl font-semibold mb-6">Watch List</h2>
        <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      {wishlistedTokens.length === 0 ? (
        <div className="text-center py-10 backdrop-blur-sm bg-card/60 border border-card-border rounded-xl">
          <p className="text-muted-foreground">No tokens in your watch list</p>
          <p className="text-xs text-muted-foreground mt-2">
            Click the star icon on any token row to add it to your watch list
          </p>
        </div>
      ) : (
        <TokenTable
          tokens={wishlistedTokens}
          wishlistedTokens={wishlistedTokens}
          onWishlistToggle={onWishlistToggle}
        />
      )}
    </div>
  )
}
