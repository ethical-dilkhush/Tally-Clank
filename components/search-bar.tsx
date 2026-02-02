"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  onSearch: (query: string) => void
  isSearching: boolean
}

export default function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce search to avoid too many API calls while typing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (query.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        onSearch(query.trim())
      }, 500) // 500ms debounce delay
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, onSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  const handleClear = () => {
    setQuery("")
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative w-full">
        <div
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground transition-colors pointer-events-none",
            isFocused ? "text-primary" : "",
          )}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 sm:h-[18px] sm:w-[18px] animate-spin" />
          ) : (
            <Search className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          )}
        </div>

        <Input
          ref={inputRef}
          type="text"
          placeholder="Search by token name or symbol"
          className={cn(
            "pl-10 pr-10 h-10 sm:h-11 w-full text-sm sm:text-base bg-muted/50 border-card-border rounded-lg",
            "transition-all duration-200 focus-visible:ring-offset-0 placeholder:text-muted-foreground",
            isFocused ? "border-primary/50 ring-1 ring-primary/20" : "",
          )}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {query.length > 0 && !isSearching && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md opacity-70 hover:opacity-100"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </form>
  )
}
