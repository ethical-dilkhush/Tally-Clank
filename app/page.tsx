"use client"

import { useEffect, useState, useCallback } from "react"
import SearchResults from "@/components/search-results"
import TokenList from "@/components/token-list"
import AutoBuyTab from "@/components/auto-buy-tab"
import TrendingTab from "@/components/trending-tab"
import Header from "@/components/header"
import Footer from "@/components/footer"
import TopNav from "@/components/top-nav"
import Pagination from "@/components/pagination"
import WatchListTab from "@/components/watch-list-tab"
import MyTokensTab from "@/components/my-tokens-tab"
import AllTallyClankTab from "@/components/all-tally-clank-tab"
import WorldChatTab from "@/components/world-chat-tab"
import BackgroundSync from "@/components/background-sync"
import { usePaginatedTokens, type Token } from "@/hooks/usePaginatedTokens"

function TokenDashboardContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Token[] | null>(null)
  const [currentTab, setCurrentTab] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [wishlistedTokens, setWishlistedTokens] = useState<Token[]>([])

  const paginated = usePaginatedTokens({
    page: currentPage,
    limit: 12,
    tab: "all",
    enabled: currentTab === "all",
  })

  const tokens = paginated.tokens
  const loading = paginated.loading
  const error = paginated.error
  const pagination = paginated.pagination

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
    if (tab === "all") setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

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
          wishlistedTokens={wishlistedTokens}
          onWishlistToggle={handleWishlistToggle}
        />
      )
    }

    if (currentTab === "autobuy") {
      return <AutoBuyTab tokens={tokens} />
    }

    if (currentTab === "watchlist") {
      return (
        <WatchListTab
          wishlistedTokens={wishlistedTokens}
          onWishlistToggle={handleWishlistToggle}
        />
      )
    }

    if (currentTab === "mytokens") {
      return (
        <MyTokensTab
          wishlistedTokens={wishlistedTokens}
          onWishlistToggle={handleWishlistToggle}
        />
      )
    }

    if (currentTab === "tallyclank") {
      return (
        <AllTallyClankTab
          wishlistedTokens={wishlistedTokens}
          onWishlistToggle={handleWishlistToggle}
        />
      )
    }

    if (currentTab === "worldchat") {
      return <WorldChatTab />
    }

    return (
      <>
        {/* Main Token List Section - Memoized Component */}
        <TokenList
          tokens={tokens}
          loading={loading}
          wishlistedTokens={wishlistedTokens}
          onWishlistToggle={handleWishlistToggle}
        />

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            isLoading={loading}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Background Sync - Automatically syncs tokens every 10 seconds */}
      <BackgroundSync enabled={true} intervalSeconds={10} />

      <Header onSearch={handleSearch} isSearching={searching} />

      {/* Top navigation - text only, below header */}
      <TopNav onTabChange={handleTabChange} activeTab={currentTab} />

      {/* Main Content Area - full width, no max-width constraint */}
      <main className="w-full max-w-none py-8 px-4 flex-grow pb-8 min-w-0">
        {/* Search Results Section - Memoized Component */}
        {searchQuery && searchResults && (
          <SearchResults
            searchQuery={searchQuery}
            searchResults={searchResults}
            searching={searching}
            onClearSearch={clearSearch}
            wishlistedTokens={wishlistedTokens}
            onWishlistToggle={handleWishlistToggle}
          />
        )}

        {/* Render tab content */}
        {renderTabContent()}
      </main>

      <Footer />
    </div>
  )
}

export default function TokenDashboard() {
  return <TokenDashboardContent />
}
