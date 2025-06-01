"use client"

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, Pause, RefreshCw, Database, Clock, AlertCircle, CheckCircle } from 'lucide-react'

interface SyncStatus {
  isRunning: boolean
  lastSync: string | null
  nextSync: string | null
  totalTokensStored: number
  lastSyncResult: {
    tokens_inserted: number
    tokens_updated: number
    tokens_found: number
    total_tokens_checked: number
    errors?: string[]
  } | null
  error: string | null
}

export default function ClankerSyncManager() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    lastSync: null,
    nextSync: null,
    totalTokensStored: 0,
    lastSyncResult: null,
    error: null
  })
  const [isManualSyncing, setIsManualSyncing] = useState(false)
  const [syncInterval, setSyncIntervalState] = useState<NodeJS.Timeout | null>(null)

  // Function to perform a sync
  const performSync = useCallback(async () => {
    try {
      const response = await fetch('/api/sync/clanker-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Sync failed')
      }

      // Update sync status
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
        lastSyncResult: result,
        error: null
      }))

      // Fetch updated status
      await fetchSyncStatus()

      console.log('✅ Sync completed:', result)
      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error'
      setSyncStatus(prev => ({
        ...prev,
        error: errorMessage,
        lastSync: new Date().toISOString()
      }))
      console.error('❌ Sync failed:', error)
      throw error
    }
  }, [])

  // Function to fetch current sync status from database
  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/sync/clanker-tokens')
      const result = await response.json()

      if (response.ok) {
        setSyncStatus(prev => ({
          ...prev,
          totalTokensStored: result.total_tokens_stored || 0
        }))
      }
    } catch (error) {
      console.error('Error fetching sync status:', error)
    }
  }, [])

  // Function to start automatic syncing
  const startAutoSync = useCallback(() => {
    if (syncInterval) {
      clearInterval(syncInterval)
    }

    // Perform initial sync
    performSync()

    // Set up interval for every 10 seconds (10000ms)
    const interval = setInterval(() => {
      performSync()
    }, 10000)

    setSyncIntervalState(interval)
    setSyncStatus(prev => ({
      ...prev,
      isRunning: true,
      nextSync: new Date(Date.now() + 10000).toISOString()
    }))

    console.log('🚀 Auto-sync started (every 10 seconds)')
  }, [performSync, syncInterval])

  // Function to stop automatic syncing
  const stopAutoSync = useCallback(() => {
    if (syncInterval) {
      clearInterval(syncInterval)
      setSyncIntervalState(null)
    }

    setSyncStatus(prev => ({
      ...prev,
      isRunning: false,
      nextSync: null
    }))

    console.log('⏹️ Auto-sync stopped')
  }, [syncInterval])

  // Function to manually trigger sync
  const manualSync = useCallback(async () => {
    setIsManualSyncing(true)
    try {
      await performSync()
    } finally {
      setIsManualSyncing(false)
    }
  }, [performSync])

  // Update next sync time every second when auto-sync is running
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (syncStatus.isRunning) {
      timer = setInterval(() => {
        setSyncStatus(prev => ({
          ...prev,
          nextSync: new Date(Date.now() + 10000).toISOString()
        }))
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [syncStatus.isRunning])

  // Fetch initial status on component mount
  useEffect(() => {
    fetchSyncStatus()
  }, [fetchSyncStatus])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (syncInterval) {
        clearInterval(syncInterval)
      }
    }
  }, [syncInterval])

  const getTimeUntilNextSync = () => {
    if (!syncStatus.nextSync) return null
    const now = new Date().getTime()
    const next = new Date(syncStatus.nextSync).getTime()
    const diff = Math.max(0, Math.floor((next - now) / 1000))
    return diff
  }

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Clanker Token Sync Manager
        </CardTitle>
        <CardDescription>
          Automatically syncs tokens from Clanker API where requestor_fid = 1049503 every 10 seconds
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={syncStatus.isRunning ? stopAutoSync : startAutoSync}
            variant={syncStatus.isRunning ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            {syncStatus.isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                Stop Auto-Sync
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Auto-Sync
              </>
            )}
          </Button>
          
          <Button
            onClick={manualSync}
            variant="outline"
            disabled={isManualSyncing}
            className="flex items-center gap-2"
          >
            {isManualSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Manual Sync
              </>
            )}
          </Button>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <Badge variant={syncStatus.isRunning ? "default" : "secondary"}>
              {syncStatus.isRunning ? "Running" : "Stopped"}
            </Badge>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tokens Stored</span>
            </div>
            <div className="text-2xl font-bold">{syncStatus.totalTokensStored}</div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Last Sync</span>
            </div>
            <div className="text-sm">{formatTime(syncStatus.lastSync)}</div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Next Sync</span>
            </div>
            <div className="text-sm">
              {syncStatus.isRunning ? (
                <>
                  {getTimeUntilNextSync() !== null ? `${getTimeUntilNextSync()}s` : 'Soon'}
                </>
              ) : (
                'Not scheduled'
              )}
            </div>
          </div>
        </div>

        {/* Last Sync Results */}
        {syncStatus.lastSyncResult && (
          <div className="p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Last Sync Results
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Found:</span>
                <div className="font-medium">{syncStatus.lastSyncResult.tokens_found}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Inserted:</span>
                <div className="font-medium text-green-600">{syncStatus.lastSyncResult.tokens_inserted}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>
                <div className="font-medium text-blue-600">{syncStatus.lastSyncResult.tokens_updated}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Checked:</span>
                <div className="font-medium">{syncStatus.lastSyncResult.total_tokens_checked}</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {syncStatus.error && (
          <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="font-medium text-destructive">Sync Error</span>
            </div>
            <div className="text-sm text-destructive">{syncStatus.error}</div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Auto-sync runs every 10 seconds when enabled</p>
          <p>• Only tokens with requestor_fid = 1049503 are stored</p>
          <p>• Duplicate tokens are automatically updated instead of inserted</p>
        </div>
      </CardContent>
    </Card>
  )
} 