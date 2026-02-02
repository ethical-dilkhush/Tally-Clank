"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import SearchBar from "@/components/search-bar"
import { WalletConnect } from "@/components/WalletConnect"
import { TokenCreateModal } from "@/components/TokenCreateModal"

interface HeaderProps {
  onSearch: (query: string) => void
  isSearching: boolean
}

export default function Header({ onSearch, isSearching }: HeaderProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleCreateClick = () => {
    setShowCreateModal(true)
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border bg-card/80 backdrop-blur-md">
      <div className="w-full max-w-none flex h-16 items-center gap-4 sm:gap-6 px-4 sm:px-6">
        {/* Left: Brand - logo + name, compact, vertically centered */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 overflow-hidden shrink-0">
              <Image
                src="/logo.webp"
                alt="Tally Clank Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-base sm:text-lg font-bold text-primary whitespace-nowrap">Tally Clank</span>
          </Link>
        </div>

        {/* Center: Prominent search - takes remaining space, visually dominant */}
        <div className="flex-1 flex items-center justify-center min-w-0 max-w-xl sm:max-w-2xl mx-auto">
          <SearchBar onSearch={onSearch} isSearching={isSearching} />
        </div>

        {/* Right: Action buttons - Create + Wallet, clear separation */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="text-sm"
            onClick={handleCreateClick}
          >
            Create
          </Button>
          <WalletConnect />
        </div>
      </div>

      {/* Token Create Modal */}
      <TokenCreateModal isOpen={showCreateModal} onClose={handleCloseCreateModal} />
    </header>
  )
}
