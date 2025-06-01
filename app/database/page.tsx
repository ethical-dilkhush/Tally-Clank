import ClankerSyncManager from '@/components/clanker-sync-manager'
import DebugDashboard from '@/components/debug-dashboard'

export default function DatabasePage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Database Management</h1>
        <p className="text-muted-foreground">
          Monitor and control the synchronization of Clanker token data
        </p>
      </div>
      
      {/* Debug Dashboard - Should be run first to diagnose issues */}
      <DebugDashboard />
      
      {/* Sync Manager - Main sync controls */}
      <ClankerSyncManager />
    </div>
  )
} 