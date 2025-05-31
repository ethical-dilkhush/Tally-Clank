"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowDown, ArrowUp } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading: boolean
}

export default function Pagination({ currentPage, totalPages, onPageChange, isLoading }: PaginationProps) {
  const [isChangingPage, setIsChangingPage] = useState(false)

  useEffect(() => {
    if (!isLoading && isChangingPage) {
      setIsChangingPage(false)
    }
  }, [isLoading, isChangingPage])

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setIsChangingPage(true)
      onPageChange(currentPage + 1)
    }
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      setIsChangingPage(true)
      onPageChange(currentPage - 1)
    }
  }

  if (currentPage >= totalPages && currentPage === 1) return null

  return (
    <div className="flex items-center justify-center gap-4 mt-8 mb-4">
      {currentPage > 1 && (
        <Button
          onClick={handlePrevious}
          disabled={isLoading}
          className="bg-card/60 backdrop-blur-sm border-card-border hover:bg-card/80 transition-colors px-6 py-2 rounded-full shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4" />
              <span>Back</span>
            </div>
          )}
        </Button>
      )}

      {currentPage < totalPages && (
        <Button
          onClick={handleLoadMore}
          disabled={isLoading}
          className="bg-card/60 backdrop-blur-sm border-card-border hover:bg-card/80 transition-colors px-6 py-2 rounded-full shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4" />
              <span>Load More</span>
            </div>
          )}
        </Button>
      )}
    </div>
  )
}
