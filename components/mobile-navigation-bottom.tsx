"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  Sparkles, 
  BookmarkCheck, 
  Zap,
  Coins,
  Building,
  MessageSquare
} from "lucide-react"

interface MobileNavigationBottomProps {
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
    label: "Watch",
    icon: BookmarkCheck
  },
  {
    id: "mytokens",
    label: "My Tokens",
    icon: Coins
  },
  {
    id: "tallyclank",
    label: "Tally",
    icon: Building
  },
  {
    id: "autobuy",
    label: "Auto Buy",
    icon: Zap
  },
  {
    id: "worldchat",
    label: "Chat",
    icon: MessageSquare
  }
]

export default function MobileNavigationBottom({ onTabChange, activeTab = "all" }: MobileNavigationBottomProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-card-border safe-area-bottom">
      <div className="grid grid-cols-7 gap-1 p-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "flex flex-col items-center gap-1 h-16 p-1 rounded-lg transition-all duration-200",
                isActive && "bg-primary/10 text-primary"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs font-medium truncate leading-tight",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-4 h-0.5 bg-primary rounded-full" />
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
} 