import { NextRequest, NextResponse } from 'next/server';

const CLANKER_API_KEY = 'tally-clank-nlv03n8n20fn09n9c2n081';
const CLANKER_API_BASE_URL = 'https://www.clanker.world/api/tokens';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const page = searchParams.get('page') || '1';

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${CLANKER_API_BASE_URL}/fetch-deployed-by-address?address=${address}&page=${page}`,
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
          error: 'Failed to fetch deployed tokens',
          details: errorData 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching deployed tokens:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 