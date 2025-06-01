import { NextRequest, NextResponse } from 'next/server';

const CLANKER_API_KEY = process.env.CLANKER_API_KEY || 'tally-clank-nlv03n8n20fn09n9c2n081';

export async function GET(request: NextRequest) {
  try {
    // Test the Clanker API with a simple request
    const response = await fetch('https://www.clanker.world/api/tokens?page=1&limit=1', {
      method: 'GET',
      headers: {
        'x-api-key': CLANKER_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      apiKeyPresent: !!CLANKER_API_KEY,
      apiKeyLength: CLANKER_API_KEY?.length || 0,
      responseReceived: !!responseData,
      data: responseData
    });

  } catch (error) {
    console.error('Error testing Clanker API:', error);
    return NextResponse.json({
      error: 'Failed to test Clanker API',
      details: error instanceof Error ? error.message : 'Unknown error',
      apiKeyPresent: !!CLANKER_API_KEY,
      apiKeyLength: CLANKER_API_KEY?.length || 0
    }, { status: 500 });
  }
} 