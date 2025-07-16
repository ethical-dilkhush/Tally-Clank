"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/sidebar-context"
import { 
  BarChart3, 
  Sparkles, 
  BookmarkCheck, 
  Zap,
  ChevronLeft,
  ChevronRight,
  Coins,
  Building,
  MessageSquare
} from "lucide-react"

interface LeftSidebarProps {
  onTabChange: (tab: string) => void
  activeTab?: string
}

const navigationItems = [
  {
    id: "all",
    label: "All Tokens",
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
    label: "All Tally Clank",
    icon: Building
  },
  {
    id: "autobuy",
    label: "Auto Buy",
    icon: Zap
  },
  {
    id: "worldchat",
    label: "World Chat",
    icon: MessageSquare
  }
]

export default function LeftSidebar({ onTabChange, activeTab = "all" }: LeftSidebarProps) {
  const { isCollapsed, setIsCollapsed } = useSidebar()

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId)
  }

  return (
    <div 
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card/95 backdrop-blur-md border-r border-card-border transition-all duration-300 z-40",
        // Hide on mobile screens (< 768px)
        "hidden md:block",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse/Expand Button */}
      <div className="flex justify-end p-3 border-b border-card-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="p-3 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-11 transition-all duration-200 hover:bg-primary/5",
                isCollapsed ? "px-2" : "px-3",
                isActive && "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
              )}
              onClick={() => handleTabChange(item.id)}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              
              {!isCollapsed && (
                <span className={cn("font-medium text-sm truncate", isActive ? "text-primary" : "text-foreground")}>
                  {item.label}
                </span>
              )}
            </Button>
          )
        })}
      </nav>

      {/* Brand section - only show when expanded */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-3 right-3 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="text-center">
            <p className="text-sm font-semibold text-primary">Tally Clank</p>
            <p className="text-xs text-muted-foreground mt-1">Token Dashboard</p>
          </div>
        </div>
      )}
    </div>
  )
} 