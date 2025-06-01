import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const TARGET_REQUESTOR_FID = 1049503;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    console.log(`📊 Fetching tokens from database (page ${page}, limit ${limit})`);

    // Get tokens from database
    const { data: tokens, error } = await supabase
      .from('clanker_tokens')
      .select('*')
      .eq('requestor_fid', TARGET_REQUESTOR_FID)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('clanker_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('requestor_fid', TARGET_REQUESTOR_FID);

    if (countError) {
      console.error('❌ Count error:', countError);
      throw countError;
    }

    // Transform to match the expected format
    const transformedTokens = (tokens || []).map((token: any) => ({
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      price: 0, // We don't store price data, this would need to be fetched from price APIs
      marketCap: token.starting_market_cap || 0,
      volume: 0, // We don't store volume data
      change24h: 0, // We don't store change data
      imageUrl: token.img_url || '',
      img_url: token.img_url || '',
      cast_hash: token.cast_hash || '',
      contractAddress: token.contract_address,
      contract_address: token.contract_address,
      blockchain: token.chain_id === 8453 ? 'Base' : 'Ethereum',
      totalSupply: 100000000000, // Standard Clanker supply
      circulatingSupply: 100000000000,
      description: token.metadata?.description || '',
      website: '',
      explorer: token.contract_address ? `https://basescan.org/token/${token.contract_address}` : '',
      createdAt: token.created_at,
      deployed_at: token.deployed_at,
      starting_market_cap: token.starting_market_cap,
      requestor_fid: token.requestor_fid,
      tx_hash: token.tx_hash,
      pool_address: token.pool_address,
      type: token.type,
      pair: token.pair,
      chain_id: token.chain_id,
      metadata: token.metadata,
      deploy_config: token.deploy_config,
      social_context: token.social_context,
      warnings: token.warnings,
      pool_config: token.pool_config,
      msg_sender: token.msg_sender,
      factory_address: token.factory_address,
      locker_address: token.locker_address,
      position_id: token.position_id,
      // Local database timestamps
      inserted_at: token.inserted_at,
      updated_at: token.updated_at
    }));

    console.log(`✅ Retrieved ${transformedTokens.length} tokens from database`);

    return NextResponse.json({
      data: transformedTokens,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching tokens from database:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tokens from database',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 