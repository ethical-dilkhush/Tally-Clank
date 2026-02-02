"use client"

import { memo } from "react"
import TokenTable, { type TokenTableToken } from "@/components/token-table"
import { useEthPrice } from "@/hooks/useEthPrice"

interface TokenListProps {
  tokens: TokenTableToken[]
  loading: boolean
  wishlistedTokens?: TokenTableToken[]
  onWishlistToggle?: (token: TokenTableToken) => void
}

const TokenList = memo(function TokenList({
  tokens,
  loading,
  wishlistedTokens = [],
  onWishlistToggle,
}: TokenListProps) {
  const { ethPriceUSD } = useEthPrice()
  return (
    <div className="relative space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <h2 className="text-2xl font-semibold">New Created Tokens</h2>
          <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </div>

      <TokenTable
        tokens={tokens}
        loading={loading}
        wishlistedTokens={wishlistedTokens}
        onWishlistToggle={onWishlistToggle}
        convertMarketCapFromEth={true}
        ethPriceUSD={ethPriceUSD}
      />
    </div>
  )
})

export default TokenList
