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
    const limit = Number.parseInt(searchParams.get("limit") || "12", 10)
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
    const response = await fetch(`https://www.clanker.world/api/tokens?offset=${offset}&limit=${limit}&_t=${now}`, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      next: { revalidate: 0 }, // Disable cache to ensure fresh data
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const rawData = await response.json()

    // Log the raw data to see what we're getting
    console.log("Raw API response:", JSON.stringify(rawData).substring(0, 500) + "...")

    // Determine the structure of the data and extract the tokens array
    let tokensArray = []
    let totalCount = 100 // Default total count if not provided by API

    // Case 1: If rawData is already an array
    if (Array.isArray(rawData)) {
      tokensArray = rawData
    }
    // Case 2: If rawData is an object with a data/items/tokens property
    else if (rawData && typeof rawData === "object") {
      if (Array.isArray(rawData.data)) tokensArray = rawData.data
      else if (Array.isArray(rawData.items)) tokensArray = rawData.items
      else if (Array.isArray(rawData.tokens)) tokensArray = rawData.tokens
      // If we can't find a known array property, return the raw data
      else tokensArray = [rawData]

      // Try to extract total count for pagination
      totalCount = rawData.total || rawData.totalCount || rawData.count || 100
    }

    // Log the first token to see its structure
    if (tokensArray.length > 0) {
      console.log("First token structure:", JSON.stringify(tokensArray[0]))
    }

    // Process tokens to fetch Warpcast data
    const processedTokens = await Promise.all(
      tokensArray.map(async (token: any) => {
        //  Extract creation time from various possible fields
        const createdAt = token.createdAt || token.created_at || token.creation_time || token.timestamp || now

        // Check all possible property names for contract address
        const contractAddress =
          token.contractAddress ||
          token.contract_address ||
          token.contract ||
          token.address ||
          token.token_address ||
          token.tokenAddress ||
          "0x0000000000000000000000000000000000000000"

        // Check for image URL in various possible properties
        let imageUrl = token.imageUrl || token.image || token.logo || token.icon || token.img || ""
        let img_url = token.img_url || ""

        // If the image URL is relative, make it absolute
        if (imageUrl && imageUrl.startsWith("/")) {
          imageUrl = `https://www.clanker.world${imageUrl}`
        }
        if (img_url && img_url.startsWith("/")) {
          img_url = `https://www.clanker.world${img_url}`
        }

        // Get requestor_fid if available
        const requestor_fid = token.requestor_fid || token.fid || ""

        // Initialize Warpcast data
        let warpcastData = {
          warpcast_username: "",
          warpcast_display_name: "",
          warpcast_profile: "",
          warpcast_pfp_url: "",
          warpcast_follower_count: 0,
          warpcast_following_count: 0,
        }

        // Fetch Warpcast data if requestor_fid is available
        if (requestor_fid) {
          // Check cache first
          if (warpcastCache.has(requestor_fid)) {
            warpcastData = warpcastCache.get(requestor_fid)
          } else {
            try {
              // Add a small delay to avoid rate limiting
              await new Promise((resolve) => setTimeout(resolve, 100))

              const warpcastResponse = await fetch(
                `https://api.neynar.com/v2/farcaster/user/bulk?fids=${requestor_fid}`,
                {
                  method: "GET",
                  headers: {
                    accept: "application/json",
                    "x-neynar-experimental": "false",
                    "x-api-key": "1BE3BF6D-C349-4D39-A542-5F25B81F0701",
                  },
                  next: { revalidate: 3600 }, // Cache for 1 hour
                },
              )

              if (!warpcastResponse.ok) {
                console.log(`Warpcast API error: ${warpcastResponse.status} ${warpcastResponse.statusText}`)
                // Don't try to parse JSON if the response is not OK
                throw new Error(`Warpcast API responded with status: ${warpcastResponse.status}`)
              }

              const responseText = await warpcastResponse.text()
              let warpcastResponseData

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
            } catch (error) {
              console.error("Error fetching Warpcast data:", error)
              // Continue with default empty warpcastData
            }
          }
        }

        return {
          id: token.id || token._id || String(Math.random()),
          name: token.name || token.tokenName || "Unknown Token",
          symbol: token.symbol || token.tokenSymbol || "???",
          price: typeof token.price === "number" ? token.price : token.currentPrice || token.tokenPrice || 0,
          marketCap:
            typeof token.marketCap === "number" ? token.marketCap : token.market_cap || token.marketCapitalization || 0,
          volume: typeof token.volume === "number" ? token.volume : token.volume24h || token.tradingVolume || 0,
          change24h: typeof token.change24h === "number" ? token.change24h : token.priceChange24h || token.change || 0,
          imageUrl,
          img_url,
          cast_hash: token.cast_hash || token.deployer || token.creator || "",
          contractAddress,
          blockchain: token.blockchain || token.network || token.chain || "Ethereum",
          totalSupply: token.totalSupply || token.total_supply || 0,
          circulatingSupply: token.circulatingSupply || token.circulating_supply || 0,
          description: token.description || token.about || "",
          website: token.website || token.websiteUrl || token.website_url || "",
          explorer: token.explorer || token.explorerUrl || token.explorer_url || "",
          createdAt,
          requestor_fid,
          ...warpcastData,
        }
      }),
    )

    // Create the response object
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
    return NextResponse.json({ error: "Failed to fetch token data" }, { status: 500 })
  }
}
