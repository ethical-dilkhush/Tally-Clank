"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import TokenDetailsDialog from "@/components/token-details-dialog"
import SearchResults from "@/components/search-results"
import TokenList from "@/components/token-list"
import AutoBuyTab from "@/components/auto-buy-tab"
import TrendingTab from "@/components/trending-tab"
import Header from "@/components/header"
import Footer from "@/components/footer"
import LeftSidebar from "@/components/left-sidebar"
import MobileNavigation from "@/components/mobile-navigation"
// import MobileNavigationBottom from "@/components/mobile-navigation-bottom" // Alternative bottom tab bar
import Pagination from "@/components/pagination"
import WatchListTab from "@/components/watch-list-tab"
import MyTokensTab from "@/components/my-tokens-tab"
import AllTallyClankTab from "@/components/all-tally-clank-tab"
import BackgroundSync from "@/components/background-sync"
import { SidebarProvider, useSidebar } from "@/components/sidebar-context"

interface Token {
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
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

function TokenDashboardContent() {
  const { isCollapsed } = useSidebar()
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Token[] | null>(null)
  const [currentTab, setCurrentTab] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  })
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTokenIdsRef = useRef<Set<string>>(new Set())
  const [wishlistedTokens, setWishlistedTokens] = useState<Token[]>([])
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  const fetchTokens = async (page = 1, tab = "all", forceRefresh = false) => {
    try {
      setRefreshing(true)

      // Construct the API URL with pagination parameters
      let apiUrl = `/api/tokens?page=${page}&limit=12&_t=${Date.now()}`

      // Add tab parameter if not "all"
      if (tab !== "all") {
        apiUrl += `&tab=${tab}`
      }

      // Add force refresh parameter if needed
      if (forceRefresh) {
        apiUrl += `&forceRefresh=true`
      }

      const response = await fetch(apiUrl, {
        // Add cache control headers to prevent caching
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Check if data contains tokens array and pagination info
      if (data && data.tokens && Array.isArray(data.tokens)) {
        // Add a timestamp to each token to help with animation triggers
        const timestampedData = data.tokens.map((token: Token) => ({
          ...token,
          _timestamp: Date.now(),
        }))

        // Store current token IDs for comparison
        const currentTokenIds = new Set(timestampedData.map((token: Token) => token.id))

        // Update the reference of last seen token IDs
        lastTokenIdsRef.current = currentTokenIds

        // Update tokens and pagination data
        setTokens(timestampedData)

        if (data.pagination) {
          setPagination(data.pagination)
        }
      } else if (data && typeof data === "object" && data.error) {
        // Handle error response from our API
        throw new Error(data.error)
      } else {
        // If data is not an array and not an error, log it and throw an error
        console.error("Unexpected data format:", data)
        throw new Error("Received invalid data format from API")
      }

      setError(null)
      setInitialLoadComplete(true)
    } catch (err) {
      setError("Failed to fetch token data. Please try again later.")
      console.error("Error fetching tokens:", err)
      setInitialLoadComplete(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const searchTokens = async (query: string) => {
    if (!query) {
      setSearchResults(null)
      return
    }

    try {
      setSearching(true)
      const response = await fetch(`/api/tokens/search?q=${encodeURIComponent(query)}&_t=${Date.now()}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`)
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        // Add timestamp to search results too
        const timestampedData = data.map((token) => ({
          ...token,
          _timestamp: Date.now(),
        }))
        setSearchResults(timestampedData)
      } else if (data && typeof data === "object" && data.error) {
        throw new Error(data.error)
      } else {
        console.error("Unexpected search result format:", data)
        throw new Error("Received invalid data format from search API")
      }
    } catch (err) {
      console.error("Error searching tokens:", err)
      setSearchResults([]) // Empty array to indicate no results
    } finally {
      setSearching(false)
    }
  }

  // Set up polling for token updates
  useEffect(() => {
    // Only set up polling for the "all" tab
    if (currentTab === "all") {
      // Initial fetch
      fetchTokens(currentPage, currentTab, true)

      // Set up polling interval
      pollingIntervalRef.current = setInterval(() => {
        fetchTokens(currentPage, currentTab)
      }, 15000) // Poll every 15 seconds (increased from 10 to reduce load)
    }

    // Clean up interval on component unmount or tab change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [currentPage, currentTab])

  // Use useCallback to memoize these functions to prevent unnecessary re-renders
  const handleTokenClick = useCallback((token: Token) => {
    setSelectedToken(token)
  }, [])

  const handleCloseDetails = useCallback(() => {
    setSelectedToken(null)
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    searchTokens(query)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery("")
    setSearchResults(null)
  }, [])

  const handleTabChange = useCallback((tab: string) => {
    setCurrentTab(tab)
    setCurrentPage(1) // Reset to first page when changing tabs

    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    // Only set up polling for the "all" tab
    if (tab === "all") {
      // Force refresh when changing to all tab
      setTimeout(() => fetchTokens(1, tab, true), 0)

      // Set up new polling interval
      pollingIntervalRef.current = setInterval(() => {
        fetchTokens(1, tab)
      }, 15000) // Poll every 15 seconds
    }
  }, [])

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: "smooth" })
      // Force refresh when changing pages
      setTimeout(() => fetchTokens(page, currentTab, true), 0)
    },
    [currentTab],
  )

  const handleWishlistToggle = useCallback((token: Token) => {
    setWishlistedTokens((prev) => {
      // Check if token is already in wishlist
      const isAlreadyWishlisted = prev.some((t) => t.id === token.id)

      let newWishlist
      if (isAlreadyWishlisted) {
        // Remove from wishlist
        newWishlist = prev.filter((t) => t.id !== token.id)
      } else {
        // Add to wishlist
        newWishlist = [...prev, token]
      }

      // Save to localStorage
      localStorage.setItem("wishlistedTokens", JSON.stringify(newWishlist))

      return newWishlist
    })
  }, [])

  useEffect(() => {
    const savedWishlist = localStorage.getItem("wishlistedTokens")
    if (savedWishlist) {
      try {
        const parsedWishlist = JSON.parse(savedWishlist)
        if (Array.isArray(parsedWishlist)) {
          setWishlistedTokens(parsedWishlist)
        }
      } catch (err) {
        console.error("Error parsing saved wishlist:", err)
      }
    }
  }, [])

  // Render the appropriate content based on the current tab
  const renderTabContent = () => {
    if (currentTab === "trending") {
      return (
        <TrendingTab
          onTokenClick={handleTokenClick}
          wishlistedTokens={wishlistedTokens}
          onWishlistToggle={handleWishlistToggle}
        />
      )
    }

    if (currentTab === "autobuy") {
      return <AutoBuyTab tokens={tokens} onTokenClick={handleTokenClick} />
    }

    if (currentTab === "watchlist") {
      return (
        <WatchListTab
          onTokenClick={handleTokenClick}
          wishlistedTokens={wishlistedTokens}
          onWishlistToggle={handleWishlistToggle}
        />
      )
    }

    if (currentTab === "mytokens") {
      return (
        <MyTokensTab
          onTokenClick={handleTokenClick}
          wishlistedTokens={wishlistedTokens}
          onWishlistToggle={handleWishlistToggle}
        />
      )
    }

    if (currentTab === "tallyclank") {
      return (
        <AllTallyClankTab
          onTokenClick={handleTokenClick}
          wishlistedTokens={wishlistedTokens}
          onWishlistToggle={handleWishlistToggle}
        />
      )
    }

    return (
      <>
        {/* Main Token List Section - Memoized Component */}
        <TokenList
          tokens={tokens}
          loading={loading && !initialLoadComplete}
          refreshing={refreshing}
          onTokenClick={handleTokenClick}
          wishlistedTokens={wishlistedTokens}
          onWishlistToggle={handleWishlistToggle}
        />

        {/* Pagination Controls */}
        {!loading && pagination.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            isLoading={loading || refreshing}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Background Sync - Automatically syncs tokens every 10 seconds */}
      <BackgroundSync enabled={true} intervalSeconds={10} />
      
      <Header
        onSearch={handleSearch}
        isSearching={searching}
      />

      {/* Left Sidebar Navigation */}
      <LeftSidebar onTabChange={handleTabChange} activeTab={currentTab} />

      {/* Mobile Navigation */}
      <MobileNavigation onTabChange={handleTabChange} activeTab={currentTab} />
      {/* Alternative Bottom Tab Bar: <MobileNavigationBottom onTabChange={handleTabChange} activeTab={currentTab} /> */}

      {/* Main Content Area with Dynamic Left Margin for Sidebar */}
      <main className={`transition-all duration-300 container mx-auto py-8 px-4 flex-grow ${
        // No margin on mobile (sidebar hidden), dynamic margin on desktop
        isCollapsed ? 'md:ml-16' : 'md:ml-64'
      } pb-20 md:pb-8`}> {/* pb-20 for bottom nav, md:pb-8 for desktop */}
        {/* Search Results Section - Memoized Component */}
        {searchQuery && searchResults && (
          <SearchResults
            searchQuery={searchQuery}
            searchResults={searchResults}
            searching={searching}
            onClearSearch={clearSearch}
            onTokenClick={handleTokenClick}
            wishlistedTokens={wishlistedTokens}
            onWishlistToggle={handleWishlistToggle}
          />
        )}

        {/* Render tab content */}
        {renderTabContent()}

        {selectedToken && (
          <TokenDetailsDialog token={selectedToken} isOpen={!!selectedToken} onClose={handleCloseDetails} />
        )}
      </main>

      <Footer />
    </div>
  )
}

export default function TokenDashboard() {
  return (
    <SidebarProvider>
      <TokenDashboardContent />
    </SidebarProvider>
  )
}
