"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  Sparkles, 
  BookmarkCheck, 
  Zap,
  Coins,
  Building
} from "lucide-react"

interface MobileNavigationProps {
  onTabChange: (tab: string) => void
  activeTab?: string
}

const navigationItems = [
  {
    id: "all",
    label: "All",
    icon: BarChart3
  },
  {
    id: "trending", 
    label: "Trending",
    icon: Sparkles
  },
  {
    id: "watchlist",
    label: "Watch List", 
    icon: BookmarkCheck
  },
  {
    id: "mytokens",
    label: "My Tokens",
    icon: Coins
  },
  {
    id: "tallyclank",
    label: "Tally Clank",
    icon: Building
  },
  {
    id: "autobuy",
    label: "Auto Buy",
    icon: Zap
  }
]

export default function MobileNavigation({ onTabChange, activeTab = "all" }: MobileNavigationProps) {
  return (
    <div className="md:hidden sticky top-16 z-30 bg-card/95 backdrop-blur-md border-b border-card-border">
      <div className="flex items-center justify-around p-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-0 flex-1",
                isActive && "bg-primary/10 border border-primary/20"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              <span className={cn("text-xs truncate", isActive && "text-primary font-medium")}>
                {item.label}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
} 