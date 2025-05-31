import { NextResponse } from "next/server"

// Cache for DexScreener API responses
const dexScreenerCache = new Map()
const CACHE_TTL = 30000 // 30 seconds cache TTL

// Modify the processDexScreenerData function to be more robust with error handling
function processDexScreenerData(dexData: any, preferredChain: string) {
  try {
    // Check if we have valid data
    if (!dexData) {
      console.log("DexScreener returned null or undefined data")
      return { pairs: [], message: "No data returned from DexScreener" }
    }

    // Log the raw data structure to help with debugging
    console.log("DexScreener raw data structure:", JSON.stringify(dexData).substring(0, 500) + "...")

    // Check if we have pairs data
    if (!dexData.pairs) {
      console.log("DexScreener data doesn't contain 'pairs' property:", dexData)
      return { pairs: [], message: "No pairs data found" }
    }

    if (!Array.isArray(dexData.pairs)) {
      console.log("DexScreener 'pairs' is not an array:", typeof dexData.pairs)
      return { pairs: [], message: "Invalid pairs data format" }
    }

    // If no pairs found
    if (dexData.pairs.length === 0) {
      return { pairs: [], message: "No pairs found for this token" }
    }

    // Sort pairs by liquidity (USD) in descending order
    const sortedPairs = [...dexData.pairs].sort((a, b) => {
      const liquidityA = Number.parseFloat(a.liquidity?.usd || "0")
      const liquidityB = Number.parseFloat(b.liquidity?.usd || "0")
      return liquidityB - liquidityA
    })

    // Try to find a pair on the preferred chain first
    let mainPair = sortedPairs.find((pair) => pair.chainId === preferredChain)

    // If no pair found on preferred chain, use the one with highest liquidity
    if (!mainPair && sortedPairs.length > 0) {
      mainPair = sortedPairs[0]
    }

    // Extract token data from the main pair
    const tokenData = mainPair
      ? {
          name: mainPair.baseToken?.name || "Unknown Token",
          symbol: mainPair.baseToken?.symbol || "???",
          price: Number.parseFloat(mainPair.priceUsd || "0"),
          priceChange24h: Number.parseFloat(mainPair.priceChange?.h24 || "0"),
          volume24h: Number.parseFloat(mainPair.volume?.h24 || "0"),
          liquidity: Number.parseFloat(mainPair.liquidity?.usd || "0"),
          fdv: Number.parseFloat(mainPair.fdv || "0"),
          marketCap: Number.parseFloat(mainPair.marketCap || "0"),
          pairAddress: mainPair.pairAddress,
          dexId: mainPair.dexId,
          chainId: mainPair.chainId,
          url: mainPair.url,
          baseToken: {
            address: mainPair.baseToken?.address,
            name: mainPair.baseToken?.name,
            symbol: mainPair.baseToken?.symbol,
          },
          quoteToken: {
            address: mainPair.quoteToken?.address,
            name: mainPair.quoteToken?.name,
            symbol: mainPair.quoteToken?.symbol,
          },
          pairCreatedAt: mainPair.pairCreatedAt,
          updatedAt: mainPair.updatedAt,
        }
      : null

    // Add additional logging to help debug price issues
    if (tokenData) {
      console.log("Extracted price:", tokenData.price)
      console.log("Raw priceUsd value:", mainPair.priceUsd)
    }

    return {
      mainPair: tokenData,
      allPairs: sortedPairs,
      totalPairs: sortedPairs.length,
    }
  } catch (error) {
    console.error("Error processing DexScreener data:", error)
    return {
      error: "Failed to process DexScreener data",
      details: error instanceof Error ? error.message : "Unknown error",
      pairs: [],
    }
  }
}

// Also modify the GET function to better handle API responses
export async function GET(request: Request) {
  try {
    // Get parameters from the URL
    const { searchParams } = new URL(request.url)
    const chainId = searchParams.get("chainId") || "ethereum"
    const tokenAddress = searchParams.get("tokenAddress")
    const forceRefresh = searchParams.get("forceRefresh") === "true"

    if (!tokenAddress) {
      return NextResponse.json({ error: "Token address is required" }, { status: 400 })
    }

    // Create cache key
    const cacheKey = `${chainId}-${tokenAddress}`
    const now = Date.now()

    // Check cache first if not forcing refresh
    if (!forceRefresh && dexScreenerCache.has(cacheKey)) {
      const cachedData = dexScreenerCache.get(cacheKey)
      if (now - cachedData.timestamp < CACHE_TTL) {
        console.log("Returning cached DexScreener data")
        return NextResponse.json(cachedData.data)
      }
    }

    // Fetch from DexScreener API
    console.log(`Fetching DexScreener data for ${chainId}/${tokenAddress}`)
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        next: { revalidate: 0 }, // Disable cache
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`DexScreener API error (${response.status}): ${errorText}`)
        throw new Error(`DexScreener API responded with status: ${response.status}`)
      }

      let dexData
      try {
        dexData = await response.json()
      } catch (parseError) {
        console.error("Error parsing DexScreener API response:", parseError)
        throw new Error("Invalid JSON response from DexScreener API")
      }

      // Process the data
      const processedData = processDexScreenerData(dexData, chainId)

      // Cache the result
      dexScreenerCache.set(cacheKey, {
        data: processedData,
        timestamp: now,
      })

      return NextResponse.json(processedData)
    } catch (fetchError) {
      console.error("Error fetching from DexScreener API:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to fetch from DexScreener API",
          details: fetchError instanceof Error ? fetchError.message : "Unknown error",
          pairs: [],
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in DexScreener route handler:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch DexScreener data",
        details: error instanceof Error ? error.message : "Unknown error",
        pairs: [],
      },
      { status: 500 },
    )
  }
}
