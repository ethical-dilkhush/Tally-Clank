import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    
    const response = await fetch(
      `https://www.clanker.world/api/tokens/trending?page=${page}&order=h24_trending`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': 'tally-clank-nlv03n8n20fn09n9c2n081',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Trending API response structure:', {
      hasTrending: !!data.trending,
      trendingLength: data.trending?.length,
      hasTokens: !!data.tokens,
      tokensKeys: data.tokens ? Object.keys(data.tokens).slice(0, 5) : [],
      firstTrendingItem: data.trending?.[0],
      sampleTokenData: data.tokens ? data.tokens[Object.keys(data.tokens)[0]] : null
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending tokens' },
      { status: 500 }
    );
  }
}
