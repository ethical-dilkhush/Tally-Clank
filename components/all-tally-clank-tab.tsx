"use client"

import { useEffect, useState, useCallback } from "react"
import TokenCard from "@/components/token-card"
import { Button } from "@/components/ui/button"
import { Loader2, Building, RefreshCw, AlertCircle } from "lucide-react"

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

interface AllTallyClankTabProps {
  onTokenClick: (token: Token) => void
  wishlistedTokens: Token[]
  onWishlistToggle: (token: Token) => void
}

interface PaginationData {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export default function AllTallyClankTab({ onTokenClick, wishlistedTokens, onWishlistToggle }: AllTallyClankTabProps) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12,
    total: 0,
    hasMore: false
  })

  const fetchTallyClankTokens = useCallback(async (page = 1, refresh = false) => {
    try {
      setLoading(page === 1 || refresh)
      setError(null)

      console.log(`🔄 Fetching Tally Clank tokens from database (page ${page})`);

      const response = await fetch(
        `/api/tokens/database?page=${page}&limit=12&_t=${Date.now()}`,
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
        throw new Error(errorData.error || 'Failed to fetch Tally Clank tokens from database')
      }

      const result = await response.json()

      if (page === 1 || refresh) {
        setTokens(result.data || [])
      } else {
        setTokens(prev => [...prev, ...(result.data || [])])
      }

      setPagination(result.pagination || {
        page,
        limit: 12,
        total: result.data?.length || 0,
        hasMore: false
      })

      console.log(`✅ Retrieved ${result.data?.length || 0} tokens from database`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Tally Clank tokens from database')
      console.error('❌ Error fetching tokens from database:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTallyClankTokens(1, true)
  }, [fetchTallyClankTokens])

  const handleRefresh = () => {
    fetchTallyClankTokens(1, true)
  }

  const handleLoadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchTallyClankTokens(currentPage + 1)
      setCurrentPage(prev => prev + 1)
    }
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
        <p className="text-muted-foreground">Loading Tally Clank tokens from database...</p>
      </div>
    )
  }

  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted/20 rounded-full p-8 mb-4">
          <Building className="h-16 w-16 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Tally Clank Tokens Found</h2>
        <p className="text-muted-foreground max-w-md mb-4">
          No tokens have been synced to the database yet. The system will automatically sync new tokens every 10 seconds.
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
          <h1 className="text-3xl font-bold">All Tally Clank Tokens</h1>
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