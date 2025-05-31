"use client"

import { TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

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

interface TrendingTabProps {
  onTokenClick: (token: Token) => void
  wishlistedTokens?: Token[]
  onWishlistToggle?: (token: Token) => void
}

export default function TrendingTab({ onTokenClick, wishlistedTokens = [], onWishlistToggle }: TrendingTabProps) {
  const [trendingTokens, setTrendingTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchTrending = async (pageNum: number, append: boolean = false) => {
    if (pageNum === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    setError(null)
    
    try {
      const res = await fetch(`/api/trending?page=${pageNum}`)
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch trending tokens: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('API Response:', data);
      
      if (!data.trending || !Array.isArray(data.trending)) {
        throw new Error('Invalid API response format');
      }
      
      // Transform the API response to match our Token interface
      const transformedTokens = data.trending.map((pool: any) => {
        const tokenData = data.tokens[pool.attributes.address];
        return {
          id: pool.id,
          name: tokenData?.name || pool.attributes.name.split(' / ')[0],
          symbol: tokenData?.symbol || pool.attributes.name.split(' / ')[0],
          price: parseFloat(pool.attributes.base_token_price_usd),
          marketCap: parseFloat(pool.attributes.market_cap_usd) || 0,
          volume: parseFloat(pool.attributes.h24_volume_usd),
          change24h: parseFloat(pool.attributes.price_change_percentage.h24),
          imageUrl: tokenData?.img_url || null,
          contractAddress: tokenData?.contract_address,
          blockchain: pool.relationships.network.data.id,
          totalSupply: null,
          circulatingSupply: null,
          description: tokenData?.metadata ? JSON.parse(tokenData.metadata).description : '',
          website: '',
          explorer: `https://basescan.org/address/${tokenData?.contract_address}`,
          createdAt: tokenData?.created_at
        };
      });

      setTrendingTokens(prev => append ? [...prev, ...transformedTokens] : transformedTokens);
      setHasMore(transformedTokens.length > 0);
    } catch (err: any) {
      console.error('Error fetching trending tokens:', err);
      setError(err.message || 'Error fetching trending tokens');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchTrending(1);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTrending(nextPage, true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <h2 className="text-2xl font-semibold flex items-center">
            <TrendingUp className="mr-2 h-6 w-6 text-primary" />
            Trending Tokens
          </h2>
          <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div>Loading trending tokens...</div>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="text-red-500 mb-2">Error loading trending tokens</div>
          <div className="text-sm text-muted-foreground">{error}</div>
        </div>
      ) : trendingTokens.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No trending tokens found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {trendingTokens.map((token) => (
              <div
                key={token.id}
                className="bg-card border border-card-border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow relative"
                onClick={() => onTokenClick(token)}
              >
                <div className="flex items-center gap-3 mb-2">
                  {token.imageUrl ? (
                    <img 
                      src={token.imageUrl} 
                      alt={token.symbol} 
                      className="h-8 w-8 rounded-full bg-muted"
                      onError={(e) => {
                        e.currentTarget.src = '/images/default-token.png';
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {token.symbol.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{token.name}</div>
                    <div className="text-xs text-muted-foreground">{token.symbol}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Price</div>
                    <div className="font-mono">${token.price?.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">24h Change</div>
                    <div className={token.change24h > 0 ? "text-green-500" : token.change24h < 0 ? "text-red-500" : ""}>
                      {token.change24h > 0 ? '+' : ''}{token.change24h?.toFixed(2)}%
                    </div>
                  </div>
                </div>
                {onWishlistToggle && (
                  <button
                    type="button"
                    className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full border ${wishlistedTokens.some(t => t.id === token.id) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                    onClick={e => { e.stopPropagation(); onWishlistToggle(token); }}
                  >
                    {wishlistedTokens.some(t => t.id === token.id) ? 'Wishlisted' : 'Wishlist'}
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading more...
                  </div>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
