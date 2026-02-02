"use client"

import { useState, useCallback, useRef, useEffect } from "react"

const POLL_INTERVAL_MS = 3000
const PAGE_SIZE = 12

export interface Token {
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
  blockchain?: string
  totalSupply?: number
  circulatingSupply?: number
  description?: string
  website?: string
  explorer?: string
  createdAt?: string | number
  _timestamp?: number
  metadata?: { socialMediaUrls?: Array<{ platform: "x" | "telegram" | "website"; url: string }> } | null
  tags?: { verified?: boolean } | null
  [key: string]: unknown
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
}

interface UsePaginatedTokensOptions {
  page: number
  limit?: number
  tab?: string
  enabled?: boolean
}

interface UsePaginatedTokensResult {
  tokens: Token[]
  loading: boolean
  error: string | null
  refreshing: boolean
  pagination: PaginationState
  refetch: (forceRefresh?: boolean) => Promise<void>
}

export function usePaginatedTokens({
  page,
  limit = PAGE_SIZE,
  tab = "all",
  enabled = true,
}: UsePaginatedTokensOptions): UsePaginatedTokensResult {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
  })

  const isFetchingRef = useRef(false)
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentPageRef = useRef(page)
  const isMountedRef = useRef(true)

  currentPageRef.current = page

  const fetchPage = useCallback(
    async (pageToFetch: number, isPoll: boolean) => {
      if (isFetchingRef.current) return
      isFetchingRef.current = true
      if (!isPoll) setRefreshing(true)

      const params = new URLSearchParams({
        page: String(pageToFetch),
        limit: String(limit),
        tab,
        _t: String(Date.now()),
      })
      if (!isPoll) params.set("forceRefresh", "true")

      try {
        const response = await fetch(`/api/tokens?${params}`, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (!response.ok) throw new Error(`API error: ${response.status}`)
        const data = await response.json()

        if (!isMountedRef.current) return

        if (data?.tokens && Array.isArray(data.tokens)) {
          const timestamped = data.tokens.map((t: Token) => ({ ...t, _timestamp: Date.now() }))
          setTokens(timestamped)
          if (data.pagination) {
            setPagination({
              page: data.pagination.page,
              limit: data.pagination.limit,
              total: data.pagination.total,
              totalPages: data.pagination.totalPages,
              hasNextPage: (data.pagination.page ?? pageToFetch) < (data.pagination.totalPages ?? 1),
            })
          }
          setError(null)
        } else if (data?.error) {
          throw new Error(data.error)
        } else {
          throw new Error("Invalid data format")
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to fetch tokens")
        }
      } finally {
        isFetchingRef.current = false
        if (isMountedRef.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [limit, tab]
  )

  const refetch = useCallback(
    async (forceRefresh = true) => {
      setRefreshing(true)
      await fetchPage(currentPageRef.current, false)
    },
    [fetchPage]
  )

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    fetchPage(page, false)
  }, [enabled, page, fetchPage])

  useEffect(() => {
    if (!enabled || tab !== "all") return

    const schedule = () => {
      if (document.hidden) return
      if (isFetchingRef.current) {
        pollingTimerRef.current = setTimeout(schedule, POLL_INTERVAL_MS)
        return
      }
      fetchPage(currentPageRef.current, true)
      pollingTimerRef.current = setTimeout(schedule, POLL_INTERVAL_MS)
    }

    const startPolling = () => {
      if (document.hidden) return
      pollingTimerRef.current = setTimeout(schedule, POLL_INTERVAL_MS)
    }

    const id = setTimeout(startPolling, POLL_INTERVAL_MS)

    const onVisibilityChange = () => {
      if (document.hidden && pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current)
        pollingTimerRef.current = null
      } else if (!document.hidden) {
        startPolling()
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current)
        pollingTimerRef.current = null
      }
      clearTimeout(id)
    }
  }, [enabled, tab, fetchPage])

  return {
    tokens,
    loading,
    error,
    refreshing,
    pagination,
    refetch,
  }
}
