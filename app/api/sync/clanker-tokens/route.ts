import { NextRequest, NextResponse } from 'next/server';
import { supabase, ClankerToken } from '@/lib/supabase';

const CLANKER_API_KEY = 'tally-clank-nlv03n8n20fn09n9c2n081';
const CLANKER_API_BASE_URL = 'https://www.clanker.world/api/tokens';
const TARGET_REQUESTOR_FID = 1049503;

// Interface for the Clanker API response
interface ClankerApiToken {
  id: number;
  created_at: string;
  tx_hash: string;
  contract_address: string;
  name: string;
  symbol: string;
  supply: string;
  img_url?: string;
  pool_address: string;
  cast_hash: string;
  type: string;
  pair: string;
  chain_id: number;
  metadata: {
    auditUrls: string[];
    description: string;
    socialMediaUrls: string[];
  };
  deploy_config: {
    devBuyAmount: number;
    lockupPercentage: number;
    vestingUnlockDate: number;
  };
  social_context: {
    interface: string;
    platform?: string;
    messageId: string;
    id: string;
  };
  requestor_fid: number;
  deployed_at: string;
  msg_sender: string;
  factory_address: string;
  locker_address: string;
  position_id?: string;
  warnings: string[];
  pool_config: {
    pairedToken: string;
    tickIfToken0IsNewToken: number;
  };
  starting_market_cap: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting Clanker token sync...');
    console.log('🎯 Target requestor_fid:', TARGET_REQUESTOR_FID);

    // Test Supabase connection first
    const { data: connectionTest, error: connectionError } = await supabase
      .from('clanker_tokens')
      .select('id')
      .limit(1);

    if (connectionError) {
      console.error('❌ Supabase connection failed:', connectionError);
      return NextResponse.json(
        { 
          error: 'Supabase connection failed',
          details: connectionError.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    console.log('✅ Supabase connection successful');

    // Fetch tokens from Clanker API
    console.log('📡 Fetching from Clanker API...');
    const response = await fetch(`${CLANKER_API_BASE_URL}?limit=100`, {
      method: 'GET',
      headers: {
        'x-api-key': CLANKER_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Clanker API error:', response.status, response.statusText, errorText);
      throw new Error(`Clanker API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 API Response structure:', {
      hasData: !!data.data,
      dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
      totalTokens: Array.isArray(data.data) ? data.data.length : 0,
      apiTotal: data.total,
      hasMore: data.hasMore
    });
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format from Clanker API');
    }

    // Analyze requestor_fids
    const allTokens = data.data;
    const uniqueRequestorFids = [...new Set(allTokens.map((token: ClankerApiToken) => token.requestor_fid))];
    console.log('🔍 Available requestor_fids:', uniqueRequestorFids.slice(0, 20));

    // Filter tokens by requestor_fid
    const filteredTokens = allTokens.filter((token: ClankerApiToken) => 
      token.requestor_fid === TARGET_REQUESTOR_FID
    );

    console.log(`📊 Found ${filteredTokens.length} tokens with requestor_fid ${TARGET_REQUESTOR_FID} out of ${allTokens.length} total tokens`);

    if (filteredTokens.length === 0) {
      // Log some sample tokens for debugging
      const sampleTokens = allTokens.slice(0, 5).map((token: ClankerApiToken) => ({
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        requestor_fid: token.requestor_fid,
        created_at: token.created_at
      }));

      return NextResponse.json({
        message: 'No tokens found with target requestor_fid',
        requestor_fid: TARGET_REQUESTOR_FID,
        total_tokens_checked: allTokens.length,
        available_requestor_fids: uniqueRequestorFids.slice(0, 20),
        sample_tokens: sampleTokens,
        tokens_inserted: 0,
        tokens_updated: 0,
        timestamp: new Date().toISOString()
      });
    }

    let tokensInserted = 0;
    let tokensUpdated = 0;
    const errors: string[] = [];
    const processedTokens: any[] = [];

    // Process each token
    for (const token of filteredTokens) {
      try {
        console.log(`🔄 Processing token: ${token.symbol} (ID: ${token.id})`);
        
        // Validate required fields
        const requiredFields = ['id', 'name', 'symbol', 'contract_address', 'tx_hash'];
        const missingFields = requiredFields.filter(field => !token[field as keyof ClankerApiToken]);
        
        if (missingFields.length > 0) {
          const errorMsg = `Token ${token.symbol} missing required fields: ${missingFields.join(', ')}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
          continue;
        }

        // Transform the token data to match our database schema
        const transformedToken: Partial<ClankerToken> = {
          id: token.id.toString(),
          created_at: token.created_at,
          tx_hash: token.tx_hash,
          contract_address: token.contract_address,
          name: token.name,
          symbol: token.symbol,
          supply: token.supply,
          img_url: token.img_url,
          pool_address: token.pool_address,
          cast_hash: token.cast_hash,
          type: token.type,
          pair: token.pair,
          chain_id: token.chain_id,
          metadata: token.metadata,
          deploy_config: token.deploy_config,
          social_context: token.social_context,
          requestor_fid: token.requestor_fid,
          deployed_at: token.deployed_at,
          msg_sender: token.msg_sender,
          factory_address: token.factory_address,
          locker_address: token.locker_address,
          position_id: token.position_id,
          warnings: token.warnings,
          pool_config: token.pool_config,
          starting_market_cap: token.starting_market_cap,
        };

        console.log(`🔍 Checking if token ${token.id} exists...`);

        // Try to insert or update the token
        const { data: existingToken, error: selectError } = await supabase
          .from('clanker_tokens')
          .select('id')
          .eq('id', token.id)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for new tokens
          console.error('❌ Select error:', selectError);
          throw selectError;
        }

        if (existingToken) {
          console.log(`📝 Updating existing token: ${token.symbol}`);
          // Update existing token
          const { error: updateError } = await supabase
            .from('clanker_tokens')
            .update(transformedToken)
            .eq('id', token.id);

          if (updateError) {
            console.error('❌ Update error:', updateError);
            throw updateError;
          }
          tokensUpdated++;
          console.log(`✅ Updated token: ${token.symbol} (${token.contract_address})`);
        } else {
          console.log(`🆕 Inserting new token: ${token.symbol}`);
          // Insert new token
          const { error: insertError } = await supabase
            .from('clanker_tokens')
            .insert(transformedToken);

          if (insertError) {
            console.error('❌ Insert error:', insertError);
            console.error('❌ Failed token data:', JSON.stringify(transformedToken, null, 2));
            throw insertError;
          }
          tokensInserted++;
          console.log(`🆕 Inserted new token: ${token.symbol} (${token.contract_address})`);
        }

        processedTokens.push({
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          action: existingToken ? 'updated' : 'inserted'
        });

      } catch (tokenError) {
        const errorMessage = `Error processing token ${token.symbol} (ID: ${token.id}): ${tokenError}`;
        console.error('❌', errorMessage);
        errors.push(errorMessage);
      }
    }

    console.log(`✨ Sync completed: ${tokensInserted} inserted, ${tokensUpdated} updated`);

    return NextResponse.json({
      message: 'Sync completed successfully',
      requestor_fid: TARGET_REQUESTOR_FID,
      total_tokens_checked: data.data.length,
      tokens_found: filteredTokens.length,
      tokens_inserted: tokensInserted,
      tokens_updated: tokensUpdated,
      processed_tokens: processedTokens,
      errors: errors.length > 0 ? errors : undefined,
      debug_info: {
        available_requestor_fids: uniqueRequestorFids.slice(0, 10),
        sample_target_tokens: filteredTokens.slice(0, 3).map(t => ({
          id: t.id,
          name: t.name,
          symbol: t.symbol,
          requestor_fid: t.requestor_fid
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in token sync:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync tokens',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check the sync status
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting sync status...');

    // Get the latest tokens from our database
    const { data: tokens, error } = await supabase
      .from('clanker_tokens')
      .select('*')
      .eq('requestor_fid', TARGET_REQUESTOR_FID)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching tokens:', error);
      throw error;
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('clanker_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('requestor_fid', TARGET_REQUESTOR_FID);

    if (countError) {
      console.error('❌ Error fetching count:', countError);
      throw countError;
    }

    console.log(`📊 Found ${count} tokens in database`);

    return NextResponse.json({
      message: 'Sync status retrieved successfully',
      requestor_fid: TARGET_REQUESTOR_FID,
      total_tokens_stored: count,
      latest_tokens: tokens,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting sync status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get sync status',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 