import { NextResponse } from "next/server"

// Simple cache to avoid repeated API calls
const warpcastCache = new Map()
const tokenCache = new Map()
let lastFetchTime = 0
const CACHE_TTL = 1000 // 1 second cache TTL

export async function GET(request: Request) {
  try {
    // Get pagination parameters from the URL
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "12", 10), 20)
    const forceRefresh = searchParams.get("forceRefresh") === "true"
    const tab = searchParams.get("tab") || "all"

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Check if we have a cached response and it's not a forced refresh
    const cacheKey = `${tab}-${page}-${limit}`
    const now = Date.now()

    if (!forceRefresh && tokenCache.has(cacheKey) && now - lastFetchTime < CACHE_TTL) {
      console.log("Returning cached token data")
      return tokenCache.get(cacheKey)
    }

    // Add pagination parameters to the API call
    // Add a timestamp to bust any caching
    const clankerApiUrl = `https://www.clanker.world/api/tokens?page=${page}&limit=${limit}&_t=${now}`
    
    console.log(`Fetching tokens from Clanker API: ${clankerApiUrl}`)

    const response = await fetch(clankerApiUrl, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "tally-clank-nlv03n8n20fn09n9c2n081",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      next: { revalidate: 0 }, // Disable cache to ensure fresh data
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(15000), // 15 second timeout
    })

    if (!response.ok) {
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        url: clankerApiUrl,
        timestamp: new Date().toISOString()
      }
      
      console.error(`Clanker API error:`, errorDetails)
      
      // Try to get more error details from the response
      try {
        const errorText = await response.text()
        if (errorText) {
          console.error(`Clanker API error response:`, errorText.substring(0, 500))
        }
      } catch (textError) {
        console.error(`Could not read error response:`, textError)
      }

      // Return a more informative error response
      return NextResponse.json(
        { 
          error: `Clanker API unavailable (${response.status})`,
          details: response.statusText,
          retryAfter: response.headers.get('Retry-After') || '30',
          timestamp: new Date().toISOString(),
          // Return empty data structure for graceful degradation
          tokens: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          }
        }, 
        { 
          status: response.status,
          headers: {
            'Retry-After': '30' // Suggest retry after 30 seconds
          }
        }
      )
    }

    const rawData = await response.json()

    // Log the raw data to see what we're getting
    console.log("Raw API response:", JSON.stringify(rawData).substring(0, 500) + "...")

    // Determine the structure of the data and extract the tokens array
    let tokensArray = []
    let totalCount = 0 // Default total count if not provided by API

    // Case 1: If rawData is already an array
    if (Array.isArray(rawData)) {
      tokensArray = rawData
      totalCount = rawData.length
    }
    // Case 2: If rawData is an object with a data/items/tokens property
    else if (rawData && typeof rawData === "object") {
      // Check for various possible structures
      if (rawData.data && Array.isArray(rawData.data)) {
        tokensArray = rawData.data
        totalCount = rawData.total || rawData.count || 50000 // Use API total or fallback
      } else if (rawData.items && Array.isArray(rawData.items)) {
        tokensArray = rawData.items
        totalCount = rawData.total || rawData.count || 50000
      } else if (rawData.tokens && Array.isArray(rawData.tokens)) {
        tokensArray = rawData.tokens
        totalCount = rawData.total || rawData.count || 50000
      } else if (rawData.results && Array.isArray(rawData.results)) {
        tokensArray = rawData.results
        totalCount = rawData.total || rawData.count || 50000
      }
    }

    // Process the tokens array to add additional data
    const processedTokens = await Promise.all(
      tokensArray.map(async (token: any) => {
        // Convert various ID formats to a consistent string
        const tokenId = token.id || token._id || token.tokenId || String(Math.random())

        // Handle different property names across APIs
        const processedToken = {
          id: tokenId,
          name: token.name || token.tokenName || "",
          symbol: token.symbol || token.ticker || "",
          price: token.price || token.current_price || 0,
          marketCap: token.market_cap || token.marketCap || token.starting_market_cap || 0,
          volume: token.volume || token.volume_24h || 0,
          change24h: token.change_24h || token.price_change_24h || 0,
          imageUrl: token.img_url || token.image_url || token.logo || "",
          img_url: token.img_url || token.image_url || token.logo || "",
          cast_hash: token.cast_hash || "",
          contractAddress: token.contract_address || token.address || "",
          blockchain: token.blockchain || token.chain || (token.chain_id === 8453 ? "Base" : "Ethereum"),
          totalSupply: token.total_supply || token.totalSupply || 0,
          circulatingSupply: token.circulating_supply || token.circulatingSupply || 0,
          description: token.description || "",
          website: token.website || "",
          explorer: token.explorer || "",
          createdAt: token.created_at || token.createdAt || token.timestamp || Date.now(),
          requestor_fid: token.requestor_fid || null,
        }

        // Only fetch Warpcast data if we have a requestor_fid
        let warpcastData = {}
        if (token.requestor_fid) {
          const requestor_fid = token.requestor_fid

          // Check cache first
          if (warpcastCache.has(requestor_fid)) {
            warpcastData = warpcastCache.get(requestor_fid)
          } else {
            // Fetch from Warpcast API
            try {
              const warpcastResponse = await fetch(`https://api.warpcast.com/v2/user?fid=${requestor_fid}`, {
                headers: {
                  "Content-Type": "application/json",
                },
              })

              if (warpcastResponse.ok) {
                const responseText = await warpcastResponse.text()
                let warpcastResponseData: any = {}

                try {
                  warpcastResponseData = JSON.parse(responseText)
                  console.log("Warpcast API response:", JSON.stringify(warpcastResponseData).substring(0, 500) + "...")

                  if (warpcastResponseData.users && warpcastResponseData.users.length > 0) {
                    const user = warpcastResponseData.users[0]
                    warpcastData = {
                      warpcast_username: user.username || "",
                      warpcast_display_name: user.display_name || "",
                      warpcast_profile: user.profile?.bio?.text || "",
                      warpcast_pfp_url: user.pfp?.url || "",
                      warpcast_follower_count: user.follower_count || 0,
                      warpcast_following_count: user.following_count || 0,
                    }

                    // Cache the result
                    warpcastCache.set(requestor_fid, warpcastData)
                  }
                } catch (parseError) {
                  console.error("Error parsing Warpcast API response:", parseError)
                  console.log("Raw response:", responseText.substring(0, 200))
                  // Continue with default empty warpcastData
                }
              } else {
                console.error("Error fetching Warpcast data:", warpcastResponse.status)
                // Continue with default empty warpcastData
              }
            } catch (error) {
              console.error("Error fetching Warpcast data:", error)
              // Continue with default empty warpcastData
            }
          }
        }

        return {
          ...processedToken,
          ...warpcastData,
        }
      }),
    )

    // Create the response data
    const responseData = {
      tokens: processedTokens,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    }

    // Create the NextResponse
    const nextResponse = NextResponse.json(responseData)

    // Update cache
    tokenCache.set(cacheKey, nextResponse.clone())
    lastFetchTime = now

    return nextResponse
  } catch (error) {
    console.error("Error fetching token data:", error)
    
    // Determine if this is a timeout or network error
    let errorMessage = "Failed to fetch token data"
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = "Request timeout - Clanker API is taking too long to respond"
        statusCode = 504
      } else if (error.message.includes('fetch')) {
        errorMessage = "Network error - Unable to connect to Clanker API"
        statusCode = 503
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        // Return empty data structure for graceful degradation
        tokens: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
        }
      }, 
      { 
        status: statusCode,
        headers: {
          'Retry-After': '30'
        }
      }
    )
  }
}
