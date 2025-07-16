import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch chat messages
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Fetching world chat messages...')
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase environment variables')
      return NextResponse.json(
        { 
          error: 'Server configuration error',
          details: 'Supabase environment variables are not configured properly',
          setupRequired: true
        },
        { status: 500 }
      )
    }

    // Test Supabase connection first
    console.log('🔍 Testing Supabase connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('world_chat')
      .select('count', { count: 'exact', head: true })

    if (connectionError) {
      console.error('❌ Supabase connection failed:', connectionError)
      
      // Check if it's a table not found error
      if (connectionError.message.includes('relation "world_chat" does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found. Please create the world_chat table first.',
            details: 'Run the SQL script from sql/create_world_chat_table.sql in your Supabase dashboard.',
            setupRequired: true
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Database connection failed', details: connectionError.message },
        { status: 500 }
      )
    }

    console.log('✅ Supabase connection successful')

    // Fetch messages from Supabase
    console.log('📊 Fetching messages from database...')
    const { data: messages, error, count } = await supabase
      .from('world_chat')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Error fetching chat messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch chat messages', details: error.message },
        { status: 500 }
      )
    }

    // Reverse the order to show oldest to newest
    const reversedMessages = messages?.reverse() || []
    
    console.log(`📊 Retrieved ${reversedMessages.length} messages`)

    const response = {
      messages: reversedMessages,
      total: count || 0,
      limit,
      offset,
      timestamp: new Date().toISOString()
    }

    console.log('✅ Sending successful response')
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ Unexpected error in GET /api/world-chat:', error)
    
    // Ensure we always return a valid JSON response
    const errorResponse = {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    console.log('📤 Sending new world chat message...')
    
    const body = await request.json()
    const { address, message } = body
    
    console.log('📋 Message data:', { address: address?.slice(0, 10) + '...', messageLength: message?.length })

    // Validate required fields
    if (!address || !message) {
      console.error('❌ Missing required fields:', { hasAddress: !!address, hasMessage: !!message })
      return NextResponse.json(
        { error: 'Address and message are required' },
        { status: 400 }
      )
    }

    // Validate message length
    if (message.length > 500) {
      console.error('❌ Message too long:', message.length)
      return NextResponse.json(
        { error: 'Message must be 500 characters or less' },
        { status: 400 }
      )
    }

    // Validate wallet address format (basic check)
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      console.error('❌ Invalid wallet address format:', address)
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Test database connection first
    console.log('🔍 Testing database connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('world_chat')
      .select('count', { count: 'exact', head: true })

    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError)
      
      if (connectionError.message.includes('relation "world_chat" does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found. Please create the world_chat table first.',
            details: 'Run the SQL script from sql/create_world_chat_table.sql in your Supabase dashboard.',
            setupRequired: true
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Database connection failed', details: connectionError.message },
        { status: 500 }
      )
    }

    console.log('✅ Database connection successful')

    // Create display name from wallet address
    const displayName = `${address.slice(0, 6)}...${address.slice(-4)}`

    // Insert message into Supabase
    console.log('💾 Inserting message into database...')
    const { data, error } = await supabase
      .from('world_chat')
      .insert([
        {
          address: address.toLowerCase(),
          message: message.trim(),
          display_name: displayName
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('❌ Error inserting chat message:', error)
      return NextResponse.json(
        { error: 'Failed to send message', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Message sent successfully:', data.id)
    return NextResponse.json({
      message: 'Message sent successfully',
      data
    })
  } catch (error) {
    console.error('❌ Error in POST /api/world-chat:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Clear all messages (for testing purposes)
export async function DELETE(request: NextRequest) {
  try {
    const { error } = await supabase
      .from('world_chat')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (error) {
      console.error('Error clearing chat messages:', error)
      return NextResponse.json(
        { error: 'Failed to clear messages', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'All messages cleared successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/world-chat:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 