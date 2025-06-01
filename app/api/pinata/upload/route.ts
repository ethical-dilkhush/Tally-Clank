import { NextRequest, NextResponse } from 'next/server';

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL;

export async function POST(request: NextRequest) {
  try {
    if (!PINATA_JWT) {
      return NextResponse.json(
        { error: 'Pinata JWT not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create new FormData for Pinata API
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);
    pinataFormData.append('network', 'public'); // Make file publicly accessible

    // Upload to Pinata using v3 API
    const response = await fetch('https://uploads.pinata.cloud/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: pinataFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Pinata API error:', errorData);
      throw new Error('Failed to upload to Pinata');
    }

    const data = await response.json();
    
    // Return both the CID and the correct gateway URL format
    const gatewayUrl = PINATA_GATEWAY_URL 
      ? `https://${PINATA_GATEWAY_URL}/ipfs/${data.data.cid}`
      : `https://gateway.pinata.cloud/ipfs/${data.data.cid}`;

    return NextResponse.json({
      success: true,
      cid: data.data.cid,
      url: gatewayUrl,
      IpfsHash: data.data.cid, // For compatibility with existing code
      data: data.data,
    });

  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    return NextResponse.json(
      { error: 'Failed to upload file to IPFS' },
      { status: 500 }
    );
  }
} 