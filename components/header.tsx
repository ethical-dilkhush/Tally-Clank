"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Wallet, AlertCircle, X } from "lucide-react"
import SearchBar from "@/components/search-bar"
import TokenDetailsDialog from "@/components/token-details-dialog"

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
}

interface HeaderProps {
  onSearch: (query: string) => void
  isSearching: boolean
  searchResults: Token[] | null
  searching: boolean
  clearSearch: () => void
}

export default function Header({ onSearch, isSearching, searchResults, searching, clearSearch }: HeaderProps) {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  // Add a new state for showing the wallet message
  const [showWalletMessage, setShowWalletMessage] = useState(false)
  // Add a new state for showing the create message
  const [showCreateMessage, setShowCreateMessage] = useState(false)

  const handleTokenClick = (token: Token) => {
    setSelectedToken(token)
  }

  const handleCloseDetails = () => {
    setSelectedToken(null)
  }

  // Add a function to handle the wallet button click
  const handleWalletClick = () => {
    setShowWalletMessage(true)
    // Auto-hide the message after 8 seconds
    setTimeout(() => {
      setShowWalletMessage(false)
    }, 8000)
  }

  // Add a function to handle the create button click
  const handleCreateClick = () => {
    setShowCreateMessage(true)
    // Auto-hide the message after 8 seconds
    setTimeout(() => {
      setShowCreateMessage(false)
    }, 8000)
  }

  // Function to close the alert manually
  const closeAlert = () => {
    setShowWalletMessage(false)
  }

  // Function to close the create alert manually
  const closeCreateAlert = () => {
    setShowCreateMessage(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 overflow-hidden">
              <Image
                src="/logo.webp"
                alt="Tally Clank Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="hidden text-xl font-bold text-primary sm:inline-block">Tally Clank</span>
          </Link>
        </div>

        {/* Search Bar - Responsive width */}
        <div className="flex-1 w-full max-w-[180px] xs:max-w-[220px] sm:max-w-[260px] md:max-w-md mx-auto px-2 sm:px-4">
          <SearchBar onSearch={onSearch} isSearching={isSearching} />
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-xs sm:text-sm"
            onClick={handleCreateClick}
          >
            <span className="hidden xs:inline">Create</span>
            <span className="xs:hidden">Create</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-xs sm:text-sm"
            onClick={handleWalletClick}
          >
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Connect Wallet</span>
            <span className="xs:hidden">Connect</span>
          </Button>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {searchResults && searchResults.length > 0 && (
        <div className="absolute left-0 right-0 top-16 z-50 max-h-[70vh] overflow-y-auto hide-scrollbar bg-card/95 backdrop-blur-md border-b border-card-border shadow-lg animate-fade-in">
          <div className="container mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Search Results</h3>
              <Button variant="ghost" size="sm" onClick={clearSearch}>
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {searchResults.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-card-border bg-card/60 cursor-pointer hover:bg-card/80 transition-colors"
                  onClick={() => handleTokenClick(token)}
                >
                  <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                    <img
                      src={token.imageUrl || token.img_url || "/placeholder.svg?height=40&width=40&query=token"}
                      alt={token.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/digital-token-network.png"
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{token.name}</p>
                    <p className="text-sm text-muted-foreground">{token.symbol}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alert-style Wallet Message Popup */}
      {showWalletMessage && (
        <div className="fixed inset-x-0 top-20 z-50 flex justify-center items-start px-4">
          <div className="bg-card shadow-glow animate-card-appear border border-primary rounded-lg max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between bg-primary/10 px-4 py-2 border-b border-primary/20">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-medium">Notice</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeAlert}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <p className="text-sm">
                This feature is used only for launching tokens, which is currently in the development phase.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Message Popup */}
      {showCreateMessage && (
        <div className="fixed inset-x-0 top-20 z-50 flex justify-center items-start px-4">
          <div className="bg-card shadow-glow animate-card-appear border border-primary rounded-lg max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between bg-primary/10 px-4 py-2 border-b border-primary/20">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-medium">Coming Soon</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeCreateAlert}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <p className="text-sm">
                This feature is coming soon. We are working on it and will be available shortly. We have already submit
                a form to Clanker to request access to the token creation API.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedToken && (
        <TokenDetailsDialog token={selectedToken} isOpen={!!selectedToken} onClose={handleCloseDetails} />
      )}
    </header>
  )
}
