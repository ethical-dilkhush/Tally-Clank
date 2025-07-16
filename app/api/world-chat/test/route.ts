import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 World Chat API test endpoint called')
    
    const response = {
      status: 'success',
      message: 'World Chat API is working correctly',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'not set'
      }
    }
    
    console.log('✅ Test endpoint responding with:', response)
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Test endpoint failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 