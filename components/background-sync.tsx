"use client"

import { useEffect, useRef } from 'react'

interface BackgroundSyncProps {
  enabled?: boolean
  intervalSeconds?: number
}

export default function BackgroundSync({ 
  enabled = true, 
  intervalSeconds = 10 
}: BackgroundSyncProps) {
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncRef = useRef<number>(0)

  const performSync = async () => {
    try {
      // Avoid syncing too frequently (minimum 5 seconds between syncs)
      const now = Date.now()
      if (now - lastSyncRef.current < 5000) {
        return
      }
      lastSyncRef.current = now

      console.log('🔄 Background sync: Checking for new tokens...')
      
      const response = await fetch('/api/sync/clanker-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Background sync completed: ${result.tokens_inserted} inserted, ${result.tokens_updated} updated`)
        
        // Only log if there were actual changes
        if (result.tokens_inserted > 0 || result.tokens_updated > 0) {
          console.log(`🆕 New tokens synced: ${result.tokens_inserted + result.tokens_updated} total changes`)
        }
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.warn('⚠️ Background sync failed:', error.error)
      }
    } catch (error) {
      console.warn('⚠️ Background sync error:', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  useEffect(() => {
    if (!enabled) return

    console.log(`🚀 Starting background sync every ${intervalSeconds} seconds`)

    // Perform initial sync after 2 seconds to let the app load
    const initialTimeout = setTimeout(performSync, 2000)

    // Set up regular interval
    syncIntervalRef.current = setInterval(performSync, intervalSeconds * 1000)

    // Cleanup function
    return () => {
      clearTimeout(initialTimeout)
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
        console.log('⏹️ Background sync stopped')
      }
    }
  }, [enabled, intervalSeconds])

  // This component doesn't render anything visible
  return null
} 