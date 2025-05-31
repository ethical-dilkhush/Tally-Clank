"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, BarChart3, BookmarkCheck, Zap } from "lucide-react"

interface TabNavigationProps {
  onTabChange: (tab: string) => void
}

export default function TabNavigation({ onTabChange }: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState("all")

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    onTabChange(value)
  }

  return (
    <div className="w-full flex justify-center mb-8">
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full max-w-3xl">
        <TabsList className="grid w-full grid-cols-4 bg-card/60 backdrop-blur-sm border border-card-border">
          <TabsTrigger value="all" className="flex items-center gap-1.5 data-[state=active]:bg-primary/10">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">All Tokens</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-1.5 data-[state=active]:bg-primary/10">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Trending</span>
            <span className="sm:hidden">Trending</span>
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="flex items-center gap-1.5 data-[state=active]:bg-primary/10">
            <BookmarkCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Watch List</span>
            <span className="sm:hidden">Watch</span>
          </TabsTrigger>
          <TabsTrigger value="autobuy" className="flex items-center gap-1.5 data-[state=active]:bg-primary/10">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Auto Buy</span>
            <span className="sm:hidden">Auto</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
