# Token Creation Setup Guide

This guide explains how to set up the token creation feature using Clanker API and Pinata IPFS.

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Pinata IPFS Configuration (using v3 API)
PINATA_JWT=your_pinata_jwt_token_here
PINATA_GATEWAY_URL=orange-electronic-iguana-442.mypinata.cloud

# Clanker API Configuration
CLANKER_API_KEY=tally-clank-nlv03n8n20fn09n9c2n081
```

## Getting API Keys

### 1. Pinata Setup (v3 Files API)
1. Visit [Pinata Cloud](https://app.pinata.cloud)
2. Create an account or sign in
3. Go to **API Keys** section and create a new JWT token with admin privileges
4. Go to **Gateways** section and copy your gateway URL (example: `orange-electronic-iguana-442.mypinata.cloud`)
5. The implementation uses the v3 Files API endpoint: `https://uploads.pinata.cloud/v3/files`

**Gateway URL Format:**
- Your dedicated gateway: `orange-electronic-iguana-442.mypinata.cloud`
- File access format: `https://orange-electronic-iguana-442.mypinata.cloud/ipfs/yourCID`

### 2. Clanker API Setup
1. Visit [Clanker.world](https://clanker.world)
2. Contact them to request API access for token deployment
3. Once approved, you'll receive an API key

## Features

The token creation form includes:

### Required Fields
- **Token Name**: The full name of your token
- **Token Symbol**: 3-10 character symbol (automatically uppercase)
- **Token Image**: Upload image that gets stored on IPFS via Pinata v3 API

### Optional Fields
- **Description**: Token description
- **Social Media URLs**: One URL per line (Twitter, Discord, etc.)
- **Creator Rewards %**: Percentage of fees (0-80%, default 40%)
- **Vault %**: Percentage to lock in creator vault (0-100%)
- **Vault Unlock Days**: Minimum 31 days lock period

### Automatic Fields
- **Requestor Address**: Taken from connected wallet
- **Request Key**: Auto-generated 32-character unique identifier
- **Platform**: Set to "TallyClank"
- **Token Pair**: Defaults to "WETH"
- **Initial Market Cap**: Set to 10 ETH

## Token Deployment Process

1. **Form Validation**: All required fields are validated
2. **Wallet Check**: Ensures wallet is connected
3. **Image Upload**: Uploads image to Pinata IPFS using v3 Files API (public network)
4. **Token Deployment**: Calls Clanker API to deploy token on Base network
5. **Success Notification**: Shows contract address and success message

## Technical Implementation

### Pinata Integration
- Uses direct v3 Files API: `https://uploads.pinata.cloud/v3/files`
- Files are uploaded to public network for accessibility
- Custom gateway URL: `https://orange-electronic-iguana-442.mypinata.cloud/ipfs/{cid}`
- Fallback to default Pinata gateway if custom gateway not configured

### Clanker Integration
- Standard deployment API: `https://www.clanker.world/api/tokens/deploy`
- Automatic request key generation for idempotency
- Full parameter support including creator vaults and rewards

## Error Handling

The system handles various error scenarios:
- Invalid form data with field-specific validation
- Wallet not connected warnings
- Image upload failures with retry capability
- API failures with detailed error messages
- Network issues with fallback handling

## Security Notes

- API keys are stored securely on the server side only
- Wallet address is automatically extracted from connected wallet
- Unique request keys prevent duplicate deployments
- All uploads are validated before processing
- Files uploaded to public IPFS network for accessibility

## Token Details

Deployed tokens will have:
- **Total Supply**: 100 billion tokens (non-mintable)
- **Network**: Base (Chain ID: 8453)
- **DEX**: Uniswap V3 pool with WETH pair
- **Starting Market Cap**: 10 ETH
- **LP Tokens**: Locked forever in Clanker LP Locker
- **Creator Rewards**: 40% of trading fees
- **Token Images**: Stored on IPFS via your dedicated Pinata gateway

## Testing

To test the functionality:
1. Set up `.env.local` with your API keys:
   ```env
   PINATA_JWT=your_jwt_token
   PINATA_GATEWAY_URL=orange-electronic-iguana-442.mypinata.cloud
   CLANKER_API_KEY=your_clanker_key
   ```
2. Connect your wallet to Base network
3. Try creating a token with various configurations
4. Verify image uploads work correctly
5. Check deployed tokens on BaseScan
6. Verify images load from your Pinata gateway

## Gateway Access

Your uploaded token images will be accessible via:
- **Direct URL**: `https://orange-electronic-iguana-442.mypinata.cloud/ipfs/{cid}`
- **Fallback**: `https://gateway.pinata.cloud/ipfs/{cid}` (if custom gateway fails)

The system automatically generates the correct URL format for your dedicated gateway. 