"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  Sparkles, 
  BookmarkCheck, 
  Zap,
  Coins,
  Building,
  Menu,
  X,
  ChevronDown,
  MessageSquare
} from "lucide-react"

interface MobileNavigationProps {
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
    label: "Tally Clank",
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

export default function MobileNavigation({ onTabChange, activeTab = "all" }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const activeItem = navigationItems.find(item => item.id === activeTab)
  const ActiveIcon = activeItem?.icon || BarChart3

  const handleTabSelect = (tabId: string) => {
    onTabChange(tabId)
    setIsOpen(false) // Close menu after selection
  }

  return (
    <div className="md:hidden sticky top-16 z-30 bg-card/95 backdrop-blur-md border-b border-card-border">
      {/* Mobile Menu Button */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <ActiveIcon className="h-5 w-5 text-primary" />
          <span className="font-medium text-foreground">{activeItem?.label || "Navigation"}</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-card border-b border-card-border shadow-lg animate-fade-in">
          <div className="p-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-12",
                    isActive && "bg-primary/10 border border-primary/20"
                  )}
                  onClick={() => handleTabSelect(item.id)}
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span className={cn("text-sm", isActive && "text-primary font-medium")}>
                    {item.label}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Overlay to close menu when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 