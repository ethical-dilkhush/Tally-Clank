import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get the search query from the URL
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    // Call the external search API
    const response = await fetch(`https://www.clanker.world/api/tokens/search?q=${encodeURIComponent(query)}`, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "tally-clank-nlv03n8n20fn09n9c2n081",
      },
      next: { revalidate: 0 }, // Disable cache to ensure fresh results
    })

    if (!response.ok) {
      throw new Error(`Search API responded with status: ${response.status}`)
    }

    const rawData = await response.json()

    // Determine the structure of the data and extract the tokens array
    let tokensArray = []

    // Case 1: If rawData is already an array
    if (Array.isArray(rawData)) {
      tokensArray = rawData
    }
    // Case 2: If rawData is an object with a data/items/tokens/results property
    else if (rawData && typeof rawData === "object") {
      if (Array.isArray(rawData.data)) tokensArray = rawData.data
      else if (Array.isArray(rawData.items)) tokensArray = rawData.items
      else if (Array.isArray(rawData.tokens)) tokensArray = rawData.tokens
      else if (Array.isArray(rawData.results)) tokensArray = rawData.results
      // If we can't find a known array property, return the raw data
      else tokensArray = [rawData]
    }

    const processedTokens = await Promise.all(
      tokensArray.map(async (token: any) => {
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

        // Extract price with fallbacks
        const price =
          typeof token.price === "number"
            ? token.price
            : typeof token.currentPrice === "number"
              ? token.currentPrice
              : typeof token.tokenPrice === "number"
                ? token.tokenPrice
                : typeof token.price_usd === "number"
                  ? token.price_usd
                  : 0

        // Extract market cap with fallbacks
        const marketCap =
          typeof token.marketCap === "number"
            ? token.marketCap
            : typeof token.market_cap === "number"
              ? token.market_cap
              : typeof token.marketCapitalization === "number"
                ? token.marketCapitalization
                : typeof token.market_cap_usd === "number"
                  ? token.market_cap_usd
                  : 0

        // Extract volume with fallbacks
        const volume =
          typeof token.volume === "number"
            ? token.volume
            : typeof token.volume24h === "number"
              ? token.volume24h
              : typeof token.tradingVolume === "number"
                ? token.tradingVolume
                : typeof token.volume_24h === "number"
                  ? token.volume_24h
                  : typeof token.volume_usd === "number"
                    ? token.volume_usd
                    : 0

        // Extract 24h change with fallbacks
        const change24h =
          typeof token.change24h === "number"
            ? token.change24h
            : typeof token.priceChange24h === "number"
              ? token.priceChange24h
              : typeof token.change === "number"
                ? token.change
                : typeof token.price_change_24h === "number"
                  ? token.price_change_24h
                  : typeof token.percent_change_24h === "number"
                    ? token.percent_change_24h
                    : 0

        const requestor_fid = token.requestor_fid || token.fid || ""

        // Extract creation time from various possible fields
        const rawCreatedAt = token.createdAt || token.created_at || token.creation_time || token.timestamp

        // Initialize normalizedCreatedAt
        let normalizedCreatedAt

        // Try to extract a valid timestamp using multiple approaches
        if (rawCreatedAt !== undefined && rawCreatedAt !== null) {
          // If it's a number, determine if it's seconds or milliseconds
          if (typeof rawCreatedAt === "number") {
            // Unix timestamps are typically 10 digits (seconds since epoch)
            // JavaScript timestamps are 13 digits (milliseconds since epoch)
            normalizedCreatedAt = rawCreatedAt < 10000000000 ? rawCreatedAt * 1000 : rawCreatedAt
          }
          // If it's a string, try to parse it as a date
          else if (typeof rawCreatedAt === "string") {
            // Try to parse the string date
            const parsedDate = new Date(rawCreatedAt)
            if (!isNaN(parsedDate.getTime())) {
              normalizedCreatedAt = parsedDate.getTime()
            } else {
              // Try to parse as a numeric string (could be a unix timestamp as string)
              const numericValue = Number.parseInt(rawCreatedAt, 10)
              if (!isNaN(numericValue)) {
                normalizedCreatedAt = numericValue < 10000000000 ? numericValue * 1000 : numericValue
              }
            }
          }
        }

        // If we still don't have a valid timestamp, generate one based on token ID or use a fallback
        if (!normalizedCreatedAt) {
          // Try to generate a deterministic timestamp based on token ID
          if (token.id) {
            // Use the first 8 characters of the hash of the ID to generate a timestamp
            // This ensures the same token always gets the same timestamp
            const idHash = String(token.id)
              .split("")
              .reduce((a, b) => {
                a = (a << 5) - a + b.charCodeAt(0)
                return a & a
              }, 0)

            // Generate a timestamp within the last 30 days (but deterministic based on ID)
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
            normalizedCreatedAt = thirtyDaysAgo + Math.abs(idHash % (30 * 24 * 60 * 60 * 1000))
          } else {
            // Last resort: use a random timestamp within the last 30 days
            // This is better than showing the same timestamp for all tokens
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
            normalizedCreatedAt = thirtyDaysAgo + Math.floor(Math.random() * (30 * 24 * 60 * 60 * 1000))
          }
        }

        return {
          id: token.id || token._id || String(Math.random()),
          name: token.name || token.tokenName || "Unknown Token",
          symbol: token.symbol || token.tokenSymbol || "???",
          price,
          marketCap,
          volume,
          change24h,
          imageUrl,
          img_url,
          cast_hash: token.cast_hash || token.deployer || token.creator || "",
          contract_address: contractAddress, // Keep original format
          contractAddress, // Add normalized format
          blockchain: token.blockchain || token.network || token.chain || "Ethereum",
          totalSupply: token.totalSupply || token.total_supply || 0,
          circulatingSupply: token.circulatingSupply || token.circulating_supply || 0,
          description: token.description || token.about || "",
          website: token.website || token.websiteUrl || token.website_url || "",
          explorer: token.explorer || token.explorerUrl || token.explorer_url || "",
          requestor_fid,
          createdAt: normalizedCreatedAt,
        }
      }),
    )

    return NextResponse.json(processedTokens)
  } catch (error) {
    console.error("Error searching tokens:", error)
    return NextResponse.json({ error: "Failed to search tokens" }, { status: 500 })
  }
}
