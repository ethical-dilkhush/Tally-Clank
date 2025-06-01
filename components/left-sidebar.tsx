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
  Building
} from "lucide-react"

interface LeftSidebarProps {
  onTabChange: (tab: string) => void
  activeTab?: string
}

const navigationItems = [
  {
    id: "all",
    label: "All Tokens",
    icon: BarChart3,
    description: "View all available tokens"
  },
  {
    id: "trending", 
    label: "Trending",
    icon: Sparkles,
    description: "Popular tokens today"
  },
  {
    id: "watchlist",
    label: "Watch List", 
    icon: BookmarkCheck,
    description: "Your saved tokens"
  },
  {
    id: "mytokens",
    label: "My Tokens",
    icon: Coins,
    description: "Tokens created via Tally Clank"
  },
  {
    id: "tallyclank",
    label: "All Tally Clank",
    icon: Building,
    description: "All official Tally Clank tokens"
  },
  {
    id: "autobuy",
    label: "Auto Buy",
    icon: Zap, 
    description: "Automated trading"
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
      {/* Collapse/Expand Button - Only show on desktop */}
      <div className="flex justify-end p-2 border-b border-card-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="p-2 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12 transition-all duration-200",
                isCollapsed ? "px-2" : "px-3",
                isActive && "bg-primary/10 border border-primary/20"
              )}
              onClick={() => handleTabChange(item.id)}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
              
              {!isCollapsed && (
                <div className="flex flex-col items-start text-left min-w-0">
                  <span className={cn("font-medium text-sm truncate", isActive && "text-primary")}>
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </span>
                </div>
              )}
            </Button>
          )
        })}
      </nav>

      {/* Additional Information Section */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-2 right-2 p-3 bg-muted/30 rounded-lg border border-card-border">
          <div className="text-xs text-center text-muted-foreground">
            <p className="font-medium">Tally Clank</p>
            <p>Token Analytics Dashboard</p>
          </div>
        </div>
      )}
    </div>
  )
} 