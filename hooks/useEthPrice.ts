"use client"

import { useState, useRef, useEffect, useCallback } from "react"

const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
const REVALIDATE_MS = 60_000 // 60 seconds

export interface UseEthPriceResult {
  /** ETH price in USD, or null while loading / before first success */
  ethPriceUSD: number | null
  /** True until first successful fetch */
  isLoading: boolean
}

/**
 * Fetches ETH price (USD) from CoinGecko once, caches it, and revalidates every 60s.
 * On API failure, keeps last cached price so the table does not break.
 */
export function useEthPrice(): UseEthPriceResult {
  const [ethPriceUSD, setEthPriceUSD] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const lastGoodPriceRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(COINGECKO_URL, {
        headers: { Accept: "application/json" },
      })
      if (!res.ok) {
        if (lastGoodPriceRef.current != null) {
          setEthPriceUSD(lastGoodPriceRef.current)
        }
        return
      }
      const data = (await res.json()) as { ethereum?: { usd?: number } }
      const price = data?.ethereum?.usd
      if (typeof price === "number" && price > 0) {
        lastGoodPriceRef.current = price
        setEthPriceUSD(price)
      } else if (lastGoodPriceRef.current != null) {
        setEthPriceUSD(lastGoodPriceRef.current)
      }
    } catch {
      if (lastGoodPriceRef.current != null) {
        setEthPriceUSD(lastGoodPriceRef.current)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrice()
    intervalRef.current = setInterval(fetchPrice, REVALIDATE_MS)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [fetchPrice])

  return { ethPriceUSD, isLoading }
}
