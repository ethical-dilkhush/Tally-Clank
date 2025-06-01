"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Bug, Database, Globe, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface DebugResult {
  success: boolean
  data?: any
  error?: string
  timestamp: string
}

export default function DebugDashboard() {
  const [clankerTest, setClankerTest] = useState<DebugResult | null>(null)
  const [supabaseTest, setSupabaseTest] = useState<DebugResult | null>(null)
  const [loadingClanker, setLoadingClanker] = useState(false)
  const [loadingSupabase, setLoadingSupabase] = useState(false)

  const testClankerAPI = async () => {
    setLoadingClanker(true)
    try {
      const response = await fetch('/api/debug/clanker-data')
      const data = await response.json()
      
      setClankerTest({
        success: response.ok,
        data: data,
        error: response.ok ? undefined : data.error,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setClankerTest({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoadingClanker(false)
    }
  }

  const testSupabase = async () => {
    setLoadingSupabase(true)
    try {
      const response = await fetch('/api/debug/supabase-test')
      const data = await response.json()
      
      setSupabaseTest({
        success: response.ok,
        data: data,
        error: response.ok ? undefined : data.error,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setSupabaseTest({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoadingSupabase(false)
    }
  }

  const StatusIcon = ({ success }: { success: boolean | undefined }) => {
    if (success === undefined) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug Dashboard
        </CardTitle>
        <CardDescription>
          Diagnose sync issues by testing each component individually
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clanker">Clanker API</TabsTrigger>
            <TabsTrigger value="supabase">Supabase</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Clanker API Test
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon success={clankerTest?.success} />
                      <span className="text-sm">
                        {clankerTest ? (clankerTest.success ? 'Connected' : 'Failed') : 'Not tested'}
                      </span>
                    </div>
                    <Button 
                      onClick={testClankerAPI} 
                      disabled={loadingClanker}
                      size="sm"
                    >
                      {loadingClanker ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Supabase Test
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon success={supabaseTest?.success} />
                      <span className="text-sm">
                        {supabaseTest ? (supabaseTest.success ? 'Connected' : 'Failed') : 'Not tested'}
                      </span>
                    </div>
                    <Button 
                      onClick={testSupabase} 
                      disabled={loadingSupabase}
                      size="sm"
                    >
                      {loadingSupabase ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Summary */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Common Issues:</strong>
                <ul className="mt-2 ml-4 list-disc text-sm">
                  <li>No tokens with requestor_fid = 1049503 in recent API responses</li>
                  <li>Missing Supabase environment variables (.env.local file)</li>
                  <li>Database table not created or incorrect schema</li>
                  <li>Supabase project inactive or API keys expired</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="clanker" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Clanker API Analysis</h3>
              <Button onClick={testClankerAPI} disabled={loadingClanker}>
                {loadingClanker ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  'Run Test'
                )}
              </Button>
            </div>

            {clankerTest && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <StatusIcon success={clankerTest.success} />
                    Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {clankerTest.success ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Tokens:</span>
                          <div className="font-medium">{clankerTest.data?.summary?.total_tokens_from_api || 0}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Unique FIDs:</span>
                          <div className="font-medium">{clankerTest.data?.summary?.unique_requestor_fids_count || 0}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target (1049503):</span>
                          <div className="font-medium">{clankerTest.data?.summary?.target_tokens_found || 0}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">API Total:</span>
                          <div className="font-medium">{clankerTest.data?.summary?.api_total || 0}</div>
                        </div>
                      </div>

                      {clankerTest.data?.target_tokens?.length > 0 ? (
                        <div>
                          <h4 className="font-medium mb-2">Found Target Tokens:</h4>
                          <div className="space-y-2">
                            {clankerTest.data.target_tokens.map((token: any, index: number) => (
                              <div key={index} className="p-2 border rounded text-sm">
                                <div className="font-medium">{token.name} ({token.symbol})</div>
                                <div className="text-muted-foreground">ID: {token.id} | Created: {new Date(token.created_at).toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>No tokens found with requestor_fid = 1049503</strong>
                            <br />
                            Available FIDs: {clankerTest.data?.sample_requestor_fids?.slice(0, 10).join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div>
                        <h4 className="font-medium mb-2">Sample Recent Tokens:</h4>
                        <div className="space-y-1 text-sm">
                          {clankerTest.data?.sample_tokens?.slice(0, 5).map((token: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 border rounded">
                              <span>{token.name} ({token.symbol})</span>
                              <Badge variant="outline">FID: {token.requestor_fid}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Alert>
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Clanker API Error:</strong> {clankerTest.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="supabase" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Supabase Connection Test</h3>
              <Button onClick={testSupabase} disabled={loadingSupabase}>
                {loadingSupabase ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  'Run Test'
                )}
              </Button>
            </div>

            {supabaseTest && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <StatusIcon success={supabaseTest.success} />
                    Connection Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supabaseTest.success ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Env Variables:</span>
                          <div className="font-medium">
                            {supabaseTest.data?.environment_variables?.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'} URL
                            {' '}
                            {supabaseTest.data?.environment_variables?.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'} Key
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Table Exists:</span>
                          <div className="font-medium">{supabaseTest.data?.table_exists ? '✅ Yes' : '❌ No'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Row Count:</span>
                          <div className="font-medium">{supabaseTest.data?.current_row_count}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Write Test:</span>
                          <div className="font-medium">
                            {supabaseTest.data?.write_test?.includes('successful') ? '✅' : '❌'}
                          </div>
                        </div>
                      </div>

                      {supabaseTest.data?.sample_data && supabaseTest.data.sample_data.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Sample Data:</h4>
                          <div className="space-y-1 text-sm">
                            {supabaseTest.data.sample_data.map((token: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-2 border rounded">
                                <span>{token.name} ({token.symbol})</span>
                                <Badge variant="outline">FID: {token.requestor_fid}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!supabaseTest.data?.environment_variables?.NEXT_PUBLIC_SUPABASE_URL && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Missing Environment Variables!</strong>
                            <br />
                            Create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
                          </AlertDescription>
                        </Alert>
                      )}

                      {!supabaseTest.data?.table_exists && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Database table missing!</strong>
                            <br />
                            Run the SQL schema from sql/create_clanker_tokens_table.sql in your Supabase dashboard
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Alert>
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Supabase Connection Error:</strong> {supabaseTest.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 