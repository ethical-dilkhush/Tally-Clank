"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import SearchBar from "@/components/search-bar"
import TokenDetailsDialog from "@/components/token-details-dialog"
import { WalletConnect } from "@/components/WalletConnect"
import { TokenCreateModal } from "@/components/TokenCreateModal"

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
}

export default function Header({ onSearch, isSearching }: HeaderProps) {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleTokenClick = (token: Token) => {
    setSelectedToken(token)
  }

  const handleCloseDetails = () => {
    setSelectedToken(null)
  }

  const handleCreateClick = () => {
    setShowCreateModal(true)
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
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
          <WalletConnect />
        </div>
      </div>

      {/* Token Create Modal */}
      <TokenCreateModal isOpen={showCreateModal} onClose={handleCloseCreateModal} />

      {selectedToken && (
        <TokenDetailsDialog token={selectedToken} isOpen={!!selectedToken} onClose={handleCloseDetails} />
      )}
    </header>
  )
}
