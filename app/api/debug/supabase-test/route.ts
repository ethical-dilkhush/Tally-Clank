import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase connection...');

    // Test 1: Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      url_value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      key_value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
    };

    // Test 2: Try to query the table structure
    let tableExists = false;
    let tableStructure = null;
    try {
      const { data, error } = await supabase
        .from('clanker_tokens')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('Table query error:', error);
      } else {
        tableExists = true;
        console.log('✅ Table accessible');
      }
    } catch (err) {
      console.log('Table access error:', err);
    }

    // Test 3: Get current row count
    let rowCount = 0;
    let countError = null;
    try {
      const { count, error } = await supabase
        .from('clanker_tokens')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        countError = error.message;
      } else {
        rowCount = count || 0;
      }
    } catch (err) {
      countError = err instanceof Error ? err.message : 'Unknown error';
    }

    // Test 4: Try to get some sample data
    let sampleData = null;
    let sampleError = null;
    try {
      const { data, error } = await supabase
        .from('clanker_tokens')
        .select('id, name, symbol, requestor_fid, created_at')
        .limit(5);
      
      if (error) {
        sampleError = error.message;
      } else {
        sampleData = data;
      }
    } catch (err) {
      sampleError = err instanceof Error ? err.message : 'Unknown error';
    }

    // Test 5: Try a simple insert/delete to test write permissions
    let writeTestResult = null;
    try {
      // Try to insert a test record
      const testRecord = {
        id: '999999999', // Using a very high ID that's unlikely to conflict
        created_at: new Date().toISOString(),
        deployed_at: new Date().toISOString(),
        tx_hash: 'test_hash_' + Date.now(),
        contract_address: 'test_address_' + Date.now(),
        name: 'Test Token',
        symbol: 'TEST',
        supply: '1000000',
        pool_address: 'test_pool_' + Date.now(),
        cast_hash: 'test_cast',
        type: 'test',
        pair: 'WETH',
        chain_id: 8453,
        metadata: {},
        deploy_config: {},
        social_context: {},
        pool_config: {},
        warnings: [],
        requestor_fid: 999999, // Different from our target FID
        msg_sender: 'test_sender',
        factory_address: 'test_factory',
        locker_address: 'test_locker',
        starting_market_cap: 10
      };

      const { error: insertError } = await supabase
        .from('clanker_tokens')
        .insert(testRecord);

      if (insertError) {
        writeTestResult = `Insert failed: ${insertError.message}`;
      } else {
        // Clean up the test record
        await supabase
          .from('clanker_tokens')
          .delete()
          .eq('id', '999999999');
        
        writeTestResult = 'Write test successful';
      }
    } catch (err) {
      writeTestResult = `Write test error: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      message: 'Supabase connection test completed',
      environment_variables: envCheck,
      table_exists: tableExists,
      current_row_count: rowCount,
      count_error: countError,
      sample_data: sampleData,
      sample_error: sampleError,
      write_test: writeTestResult,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'Not set',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Supabase test error:', error);
    return NextResponse.json(
      {
        error: 'Failed to test Supabase connection',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 