import { NextResponse } from "next/server"

// Cache for DexScreener pairs API responses
const pairsCache = new Map()
const CACHE_TTL = 30000 // 30 seconds cache TTL

export async function GET(request: Request) {
  try {
    // Get parameters from the URL
    const { searchParams } = new URL(request.url)
    const chainId = searchParams.get("chainId") || "ethereum"
    const pairAddress = searchParams.get("pairAddress")
    const forceRefresh = searchParams.get("forceRefresh") === "true"

    if (!pairAddress) {
      return NextResponse.json({ error: "Pair address is required" }, { status: 400 })
    }

    // Create cache key
    const cacheKey = `${chainId}-${pairAddress}`
    const now = Date.now()

    // Check cache first if not forcing refresh
    if (!forceRefresh && pairsCache.has(cacheKey)) {
      const cachedData = pairsCache.get(cacheKey)
      if (now - cachedData.timestamp < CACHE_TTL) {
        console.log("Returning cached DexScreener pair data")
        return NextResponse.json(cachedData.data)
      }
    }

    // Fetch from DexScreener API
    console.log(`Fetching DexScreener pair data for ${chainId}/${pairAddress}`)
    const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairAddress}`, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      next: { revalidate: 0 }, // Disable cache
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`DexScreener Pairs API error (${response.status}): ${errorText}`)
      throw new Error(`DexScreener Pairs API responded with status: ${response.status}`)
    }

    const pairData = await response.json()

    // Cache the result
    pairsCache.set(cacheKey, {
      data: pairData,
      timestamp: now,
    })

    return NextResponse.json(pairData)
  } catch (error) {
    console.error("Error fetching DexScreener pair data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch DexScreener pair data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
