"use client"

import { TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import Pagination from "@/components/pagination"

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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Format large numbers for display
  const formatLargeNumber = (value: number) => {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`
    }
    return value.toFixed(2)
  }

  const fetchTrending = async (pageNum: number) => {
    setLoading(true)
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
      
      // Handle the actual data structure returned by the trending API
      let tokensArray = [];
      
      if (Array.isArray(data)) {
        tokensArray = data;
      } else if (data && Array.isArray(data.data)) {
        tokensArray = data.data;
      } else if (data && Array.isArray(data.tokens)) {
        tokensArray = data.tokens;
      } else if (data && data.trending && Array.isArray(data.trending)) {
        // Handle the complex structure with trending pools and tokens
        tokensArray = data.trending.map((pool: any) => {
          const tokenData = data.tokens ? data.tokens[pool.attributes?.address] : null;
          
          // Handle metadata parsing safely
          let description = '';
          if (tokenData?.metadata) {
            try {
              // Check if metadata is already an object or a string
              if (typeof tokenData.metadata === 'string') {
                description = JSON.parse(tokenData.metadata).description || '';
              } else if (typeof tokenData.metadata === 'object' && tokenData.metadata.description) {
                description = tokenData.metadata.description || '';
              }
            } catch (error) {
              console.warn('Failed to parse metadata:', error, 'metadata value:', tokenData.metadata);
              description = '';
            }
          }
          
          return {
            id: pool.id,
            name: tokenData?.name || pool.attributes?.name?.split(' / ')[0] || 'Unknown',
            symbol: tokenData?.symbol || pool.attributes?.name?.split(' / ')[0] || 'UNK',
            price: parseFloat(pool.attributes?.base_token_price_usd || '0'),
            marketCap: parseFloat(pool.attributes?.market_cap_usd || '0'),
            volume: parseFloat(pool.attributes?.h24_volume_usd || '0'),
            change24h: parseFloat(pool.attributes?.price_change_percentage?.h24 || '0'),
            imageUrl: tokenData?.img_url || null,
            contractAddress: tokenData?.contract_address,
            blockchain: pool.relationships?.network?.data?.id || 'base',
            totalSupply: null,
            circulatingSupply: null,
            description: description,
            website: '',
            explorer: tokenData?.contract_address ? `https://basescan.org/address/${tokenData.contract_address}` : '',
            createdAt: tokenData?.created_at || Date.now()
          };
        });
      } else {
        throw new Error('Invalid API response format - no recognizable token data');
      }
      
      // Transform simple token array to our Token interface
      const transformedTokens = tokensArray.length > 0 && tokensArray[0].attributes ? 
        tokensArray : // Already transformed above
        tokensArray.map((token: any) => ({
          id: token.id || String(Math.random()),
          name: token.name || 'Unknown Token',
          symbol: token.symbol || 'UNK',
          price: token.price || 0,
          marketCap: token.marketCap || token.market_cap || 0,
          volume: token.volume || token.volume24h || 0,
          change24h: token.change24h || token.priceChange24h || 0,
          imageUrl: token.imageUrl || token.img_url || null,
          contractAddress: token.contractAddress || token.contract_address,
          blockchain: token.blockchain || 'base',
          totalSupply: token.totalSupply || null,
          circulatingSupply: token.circulatingSupply || null,
          description: token.description || '',
          website: token.website || '',
          explorer: token.explorer || '',
          createdAt: token.createdAt || Date.now()
        }));

      setTrendingTokens(transformedTokens);
      
      // Calculate total pages (assuming 12 tokens per page and estimating total)
      const tokensPerPage = 12;
      const estimatedTotal = Math.max(tokensArray.length * 10, 100); // Estimate based on current results
      setTotalPages(Math.ceil(estimatedTotal / tokensPerPage));
      
    } catch (err: any) {
      console.error('Error fetching trending tokens:', err);
      setError(err.message || 'Error fetching trending tokens');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrending(1);
  }, []);

  const handlePageChange = (pageNum: number) => {
    setCurrentPage(pageNum);
    fetchTrending(pageNum);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                    <div className="text-xs text-muted-foreground">Market Cap</div>
                    <div className="font-mono">${token.marketCap ? formatLargeNumber(token.marketCap) : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">24h Change</div>
                    <div className={token.change24h > 0 ? "text-green-500" : token.change24h < 0 ? "text-red-500" : ""}>
                      {token.change24h > 0 ? '+' : ''}{token.change24h?.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Volume (24h)</div>
                    <div className="font-mono">${token.volume ? formatLargeNumber(token.volume) : 'N/A'}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {/* Empty space to maintain layout balance */}
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
          
          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={loading}
            />
          )}
        </>
      )}
    </div>
  )
}
