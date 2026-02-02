"use client"

import { cn } from "@/lib/utils"

interface TopNavProps {
  onTabChange: (tab: string) => void
  activeTab?: string
}

const navigationItems = [
  { id: "all", label: "All Tokens" },
  { id: "trending", label: "Trending" },
  { id: "watchlist", label: "Watch List" },
  { id: "mytokens", label: "My Tokens" },
  { id: "tallyclank", label: "All Tally Clank" },
  { id: "autobuy", label: "Auto Buy" },
  { id: "worldchat", label: "World Chat" },
]

export default function TopNav({ onTabChange, activeTab = "all" }: TopNavProps) {
  return (
    <nav className="sticky top-16 z-40 w-full border-b border-card-border bg-card/80 backdrop-blur-md">
      <div className="w-full max-w-none px-4">
        <div className="flex items-center justify-start gap-1 overflow-x-auto py-3 scrollbar-thin md:gap-0">
          {navigationItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "relative shrink-0 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap",
                  isActive && "text-primary"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
