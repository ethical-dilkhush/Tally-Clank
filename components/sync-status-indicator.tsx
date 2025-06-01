"use client"

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface SyncStatus {
  lastSync: Date | null
  isActive: boolean
  tokenCount: number
}

export default function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    isActive: false,
    tokenCount: 0
  })

  // Listen for console logs or storage events to detect sync activity
  useEffect(() => {
    // Check if sync is active by looking for recent activity
    const checkSyncStatus = async () => {
      try {
        const response = await fetch('/api/sync/clanker-tokens', {
          method: 'GET'
        })
        
        if (response.ok) {
          const data = await response.json()
          setSyncStatus(prev => ({
            ...prev,
            tokenCount: data.total_tokens_stored || 0,
            lastSync: new Date()
          }))
        }
      } catch (error) {
        console.warn('Failed to check sync status:', error)
      }
    }

    // Initial check
    checkSyncStatus()

    // Set up periodic status check (every 30 seconds)
    const interval = setInterval(checkSyncStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  // Monitor for background sync activity by intercepting console logs
  useEffect(() => {
    const originalConsoleLog = console.log
    
    console.log = (...args) => {
      originalConsoleLog.apply(console, args)
      
      // Look for background sync messages
      const message = args.join(' ')
      if (message.includes('Background sync completed') || message.includes('New tokens synced')) {
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date(),
          isActive: true
        }))
        
        // Reset active status after 15 seconds
        setTimeout(() => {
          setSyncStatus(prev => ({ ...prev, isActive: false }))
        }, 15000)
      }
    }

    return () => {
      console.log = originalConsoleLog
    }
  }, [])

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never'
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else {
      return date.toLocaleTimeString()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant="outline" 
        className="bg-background/95 backdrop-blur-sm border-muted-foreground/20 text-xs px-2 py-1"
      >
        <div className="flex items-center gap-1">
          {syncStatus.isActive ? (
            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          ) : syncStatus.lastSync ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <AlertCircle className="h-3 w-3 text-yellow-500" />
          )}
          <span className="text-xs">
            Sync: {formatLastSync(syncStatus.lastSync)}
          </span>
          {syncStatus.tokenCount > 0 && (
            <span className="text-xs text-muted-foreground">
              • {syncStatus.tokenCount} tokens
            </span>
          )}
        </div>
      </Badge>
    </div>
  )
} 