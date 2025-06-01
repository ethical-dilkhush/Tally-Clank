import { NextRequest, NextResponse } from 'next/server';

const CLANKER_API_URL = 'https://www.clanker.world/api/tokens/deploy';
const CLANKER_API_KEY = process.env.CLANKER_API_KEY || 'tally-clank-nlv03n8n20fn09n9c2n081';

export async function POST(request: NextRequest) {
  try {
    if (!CLANKER_API_KEY) {
      return NextResponse.json(
        { error: 'Clanker API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('Received token creation request:', {
      name: body.name,
      symbol: body.symbol,
      hasImage: !!body.image,
      imageUrl: body.image?.substring(0, 50) + '...',
      requestorAddress: body.requestorAddress,
      requestKey: body.requestKey?.substring(0, 10) + '...'
    });

    // Validate required fields
    const requiredFields = ['name', 'symbol', 'image', 'requestorAddress', 'requestKey'];
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate requestKey length (should be 32 characters)
    if (body.requestKey.length !== 32) {
      console.error('Invalid requestKey length:', body.requestKey.length);
      return NextResponse.json(
        { error: 'Request key must be exactly 32 characters long' },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.requestorAddress)) {
      console.error('Invalid Ethereum address format:', body.requestorAddress);
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Prepare the payload for Clanker API
    const clankerPayload = {
      name: body.name,
      symbol: body.symbol,
      image: body.image,
      requestorAddress: body.requestorAddress,
      requestKey: body.requestKey,
      creatorRewardsPercentage: body.creatorRewardsPercentage || 40,
      tokenPair: body.tokenPair || 'WETH',
      description: body.description || '',
      socialMediaUrls: body.socialMediaUrls || [],
      platform: body.platform || 'TallyClank',
      creatorRewardsAdmin: body.creatorRewardsAdmin || body.requestorAddress,
      initialMarketCap: body.initialMarketCap || 10
    };

    console.log('Sending to Clanker API:', {
      ...clankerPayload,
      image: clankerPayload.image.substring(0, 50) + '...',
      requestKey: clankerPayload.requestKey.substring(0, 10) + '...'
    });

    // Deploy token via Clanker API
    const response = await fetch(CLANKER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLANKER_API_KEY,
      },
      body: JSON.stringify(clankerPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Clanker API error:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      
      return NextResponse.json(
        { 
          error: responseData.message || responseData.error || 'Failed to deploy token',
          details: responseData 
        },
        { status: response.status }
      );
    }

    console.log('Clanker API success:', responseData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error deploying token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 