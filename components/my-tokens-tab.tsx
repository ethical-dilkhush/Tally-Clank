"use client"

import { useEffect, useState, useCallback } from "react"
import { useAccount } from "wagmi"
import TokenCard from "@/components/token-card"
import { Button } from "@/components/ui/button"
import { Loader2, Wallet, RefreshCw, AlertCircle } from "lucide-react"

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
  contract_address?: string
  blockchain?: string
  totalSupply?: number
  circulatingSupply?: number
  description?: string
  website?: string
  explorer?: string
  createdAt?: string | number
  deployed_at?: string
  starting_market_cap?: number
}

interface MyTokensTabProps {
  onTokenClick: (token: Token) => void
  wishlistedTokens: Token[]
  onWishlistToggle: (token: Token) => void
}

interface PaginationData {
  page: number
  hasMore: boolean
  total: number
}

export default function MyTokensTab({ onTokenClick, wishlistedTokens, onWishlistToggle }: MyTokensTabProps) {
  const { address, isConnected } = useAccount()
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    hasMore: false,
    total: 0
  })

  const fetchMyTokens = useCallback(async (page = 1, refresh = false) => {
    if (!address || !isConnected) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/clanker/deployed-by-address?address=${address}&page=${page}&_t=${Date.now()}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch your tokens')
      }

      const data = await response.json()

      // Transform data to match our Token interface
      const transformedTokens = (data.data || []).map((token: any) => ({
        id: token.id || token._id || String(Math.random()),
        name: token.name || 'Unknown Token',
        symbol: token.symbol || '???',
        price: token.price || 0,
        marketCap: token.starting_market_cap || token.marketCap || 0,
        volume: token.volume || 0,
        change24h: token.change24h || 0,
        imageUrl: token.img_url || token.imageUrl || '',
        img_url: token.img_url || '',
        cast_hash: token.cast_hash || '',
        contractAddress: token.contract_address || token.contractAddress || '',
        contract_address: token.contract_address || '',
        blockchain: token.chain_id === 8453 ? 'Base' : 'Ethereum',
        totalSupply: 100000000000, // Standard Clanker supply
        circulatingSupply: 100000000000,
        description: token.metadata?.description || '',
        website: '',
        explorer: token.contract_address ? `https://basescan.org/token/${token.contract_address}` : '',
        createdAt: token.deployed_at || token.created_at,
        deployed_at: token.deployed_at,
        starting_market_cap: token.starting_market_cap
      }))

      if (page === 1 || refresh) {
        setTokens(transformedTokens)
      } else {
        setTokens(prev => [...prev, ...transformedTokens])
      }

      setPagination({
        page,
        hasMore: data.hasMore || false,
        total: data.total || transformedTokens.length
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch your tokens')
      console.error('Error fetching my tokens:', err)
    } finally {
      setLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    if (isConnected && address) {
      fetchMyTokens(1, true)
    } else {
      setTokens([])
      setError(null)
    }
  }, [fetchMyTokens, isConnected, address])

  const handleRefresh = () => {
    fetchMyTokens(1, true)
  }

  const handleLoadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchMyTokens(currentPage + 1)
      setCurrentPage(prev => prev + 1)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground max-w-md">
          Connect your wallet to view tokens you've created through Tally Clank.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Tokens</h2>
        <p className="text-muted-foreground max-w-md mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  if (loading && tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your tokens...</p>
      </div>
    )
  }

  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted/20 rounded-full p-8 mb-4">
          <Wallet className="h-16 w-16 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Tokens Created Yet</h2>
        <p className="text-muted-foreground max-w-md mb-4">
          You haven't created any tokens through Tally Clank yet. Create your first token to see it here!
        </p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Tokens</h1>
          <p className="text-muted-foreground mt-1">
            Tokens you've created through Tally Clank ({pagination.total} total)
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Token Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tokens.map((token) => (
          <TokenCard
            key={token.id}
            token={token}
            onClick={onTokenClick}
            isWishlisted={wishlistedTokens.some(w => w.id === token.id)}
            onWishlistToggle={onWishlistToggle}
          />
        ))}
      </div>

      {/* Load More Button */}
      {pagination.hasMore && (
        <div className="flex justify-center pt-6">
          <Button 
            onClick={handleLoadMore} 
            variant="outline" 
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
} 