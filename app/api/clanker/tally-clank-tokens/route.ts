import { NextRequest, NextResponse } from 'next/server';

const CLANKER_API_KEY = 'tally-clank-nlv03n8n20fn09n9c2n081';
const CLANKER_API_BASE_URL = 'https://www.clanker.world/api/tokens';
const TALLY_CLANK_DEPLOYER_ADDRESS = '0x23fc5f7179d8aaf18d3f8a85175160c33fc7cbc7';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';

    const response = await fetch(
      `${CLANKER_API_BASE_URL}/fetch-deployed-by-address?address=${TALLY_CLANK_DEPLOYER_ADDRESS}&page=${page}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': CLANKER_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Clanker API error:', response.status, errorData);
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch Tally Clank tokens',
          details: errorData 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching Tally Clank tokens:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 