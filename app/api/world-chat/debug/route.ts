import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔧 Running World Chat debug checks...')
    
    const results = {
      timestamp: new Date().toISOString(),
      checks: [] as any[],
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      }
    }

    // Test 1: Basic Supabase connection
    console.log('🔍 Testing basic Supabase connection...')
    try {
      const { data, error } = await supabase
        .from('world_chat')
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        if (error.message.includes('relation "world_chat" does not exist')) {
          results.checks.push({
            name: 'Database Table',
            status: '❌ Not Found',
            message: 'The world_chat table does not exist. Please run the SQL script.',
            details: error.message
          })
        } else {
          results.checks.push({
            name: 'Database Connection',
            status: '❌ Failed',
            message: 'Database connection failed',
            details: error.message
          })
        }
      } else {
        results.checks.push({
          name: 'Database Table',
          status: '✅ Found',
          message: 'world_chat table exists and is accessible',
          count: data
        })
      }
    } catch (error) {
      results.checks.push({
        name: 'Database Connection',
        status: '❌ Error',
        message: 'Failed to connect to database',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: Try to fetch messages
    console.log('🔍 Testing message fetching...')
    try {
      const { data: messages, error } = await supabase
        .from('world_chat')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) {
        console.error('❌ Message fetching error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        results.checks.push({
          name: 'Message Fetching',
          status: '❌ Failed',
          message: 'Could not fetch messages',
          details: error.message,
          errorCode: error.code,
          hint: error.hint
        })
      } else {
        results.checks.push({
          name: 'Message Fetching',
          status: '✅ Success',
          message: `Successfully fetched ${messages?.length || 0} messages`,
          sampleData: messages?.slice(0, 2) || []
        })
      }
    } catch (error) {
      console.error('❌ Message fetching exception:', error)
      results.checks.push({
        name: 'Message Fetching',
        status: '❌ Error',
        message: 'Error while fetching messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: Check table structure
    console.log('🔍 Testing table structure...')
    try {
      const { data, error } = await supabase
        .from('world_chat')
        .select('*')
        .limit(1)
      
      if (error) {
        console.error('❌ Table structure error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        results.checks.push({
          name: 'Table Structure',
          status: '❌ Failed',
          message: 'Could not verify table structure',
          details: error.message,
          errorCode: error.code,
          hint: error.hint
        })
      } else {
        results.checks.push({
          name: 'Table Structure',
          status: '✅ Verified',
          message: 'Table structure looks correct',
          columns: data && data.length > 0 ? Object.keys(data[0]) : ['id', 'address', 'message', 'display_name', 'created_at', 'updated_at']
        })
      }
    } catch (error) {
      console.error('❌ Table structure exception:', error)
      results.checks.push({
        name: 'Table Structure',
        status: '❌ Error',
        message: 'Error checking table structure',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 4: Test message insertion (with test data)
    console.log('🔍 Testing message insertion...')
    try {
      const testMessage = {
        address: '0x1234567890123456789012345678901234567890',
        message: 'Test message from debug endpoint',
        display_name: '0x1234...7890'
      }
      
      const { data, error } = await supabase
        .from('world_chat')
        .insert([testMessage])
        .select()
        .single()
      
      if (error) {
        console.error('❌ Message insertion error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        results.checks.push({
          name: 'Message Insertion',
          status: '❌ Failed',
          message: 'Could not insert test message',
          details: error.message,
          errorCode: error.code,
          hint: error.hint
        })
      } else {
        results.checks.push({
          name: 'Message Insertion',
          status: '✅ Success',
          message: 'Successfully inserted test message',
          testMessageId: data.id
        })
        
        // Clean up test message
        await supabase
          .from('world_chat')
          .delete()
          .eq('id', data.id)
      }
    } catch (error) {
      console.error('❌ Message insertion exception:', error)
      results.checks.push({
        name: 'Message Insertion',
        status: '❌ Error',
        message: 'Error testing message insertion',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    console.log('🔧 Debug checks completed')
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 