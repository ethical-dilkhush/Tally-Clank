/**
 * Maps blockchain name to DexScreener chainId
 */
export function mapBlockchainToDexScreenerChainId(blockchain: string): string {
  const chainMap: Record<string, string> = {
    ethereum: "ethereum",
    eth: "ethereum",
    bsc: "bsc",
    binance: "bsc",
    polygon: "polygon",
    matic: "polygon",
    avalanche: "avalanche",
    avax: "avalanche",
    fantom: "fantom",
    ftm: "fantom",
    arbitrum: "arbitrum",
    optimism: "optimism",
    base: "base",
    solana: "solana",
    sol: "solana",
  }

  const normalizedChain = blockchain.toLowerCase()
  return chainMap[normalizedChain] || normalizedChain
}

/**
 * Formats a large number with appropriate suffix (K, M, B)
 * Now includes the $ sign for financial values
 */
export function formatLargeNumber(value: number, includeDollarSign = true): string {
  const prefix = includeDollarSign ? "$" : ""

  if (value >= 1_000_000_000) {
    return `${prefix}${(value / 1_000_000_000).toFixed(2)}B`
  } else if (value >= 1_000_000) {
    return `${prefix}${(value / 1_000_000).toFixed(2)}M`
  } else if (value >= 1_000) {
    return `${prefix}${(value / 1_000).toFixed(2)}K`
  }
  return `${prefix}${value.toFixed(2)}`
}

/**
 * Formats a currency value with better handling for small numbers
 * Shows up to 8 decimal places for small values
 */
export function formatCurrency(value: number): string {
  // For extremely small values, use scientific notation
  if (value > 0 && value < 0.00000001) {
    return `$${value.toExponential(4)}`
  }

  // For normal values, use standard formatting with up to 8 decimal places for small values
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 8 : 2, // Show up to 8 decimals for small values
  }).format(value)
}

/**
 * Formats a count with appropriate suffix (K, M)
 */
export function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  } else if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`
  }
  return count.toString()
}
