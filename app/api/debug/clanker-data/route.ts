import { NextRequest, NextResponse } from 'next/server';

const CLANKER_API_KEY = 'tally-clank-nlv03n8n20fn09n9c2n081';
const CLANKER_API_BASE_URL = 'https://www.clanker.world/api/tokens';
const TARGET_REQUESTOR_FID = 1049503;

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Fetching raw Clanker data...');

    // Fetch tokens from Clanker API
    const response = await fetch(`${CLANKER_API_BASE_URL}?limit=100`, {
      method: 'GET',
      headers: {
        'x-api-key': CLANKER_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Clanker API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📊 Raw API response structure:', {
      hasData: !!data.data,
      dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
      dataLength: Array.isArray(data.data) ? data.data.length : 'N/A',
      totalFromAPI: data.total,
      hasMore: data.hasMore
    });

    if (!data.data || !Array.isArray(data.data)) {
      return NextResponse.json({
        error: 'Invalid response format from Clanker API',
        rawResponse: data,
        timestamp: new Date().toISOString()
      });
    }

    // Analyze all tokens
    const allTokens = data.data;
    const uniqueRequestorFids = [...new Set(allTokens.map((token: any) => token.requestor_fid))];
    const targetTokens = allTokens.filter((token: any) => token.requestor_fid === TARGET_REQUESTOR_FID);
    
    // Get sample tokens with different requestor_fids
    const sampleTokens = uniqueRequestorFids.slice(0, 10).map(fid => {
      const token = allTokens.find((t: any) => t.requestor_fid === fid);
      return {
        requestor_fid: fid,
        name: token?.name,
        symbol: token?.symbol,
        id: token?.id,
        created_at: token?.created_at
      };
    });

    // Check if our target tokens exist
    let targetTokenDetails = [];
    if (targetTokens.length > 0) {
      targetTokenDetails = targetTokens.map((token: any) => ({
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        created_at: token.created_at,
        requestor_fid: token.requestor_fid,
        contract_address: token.contract_address,
        hasAllRequiredFields: !!(token.id && token.name && token.symbol && token.contract_address)
      }));
    }

    return NextResponse.json({
      message: 'Debug data retrieved successfully',
      summary: {
        total_tokens_from_api: allTokens.length,
        unique_requestor_fids_count: uniqueRequestorFids.length,
        target_requestor_fid: TARGET_REQUESTOR_FID,
        target_tokens_found: targetTokens.length,
        api_has_more: data.hasMore,
        api_total: data.total
      },
      sample_requestor_fids: uniqueRequestorFids.slice(0, 20),
      sample_tokens: sampleTokens,
      target_tokens: targetTokenDetails,
      raw_api_response_keys: Object.keys(data),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch debug data',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 