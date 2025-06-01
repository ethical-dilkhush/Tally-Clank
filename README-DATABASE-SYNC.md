# Clanker Token Database Sync System

This system automatically syncs token data from the Clanker API to a Supabase database every 10 seconds, storing only tokens where `requestor_fid = 1049503`.

## 🚀 Features

- **Automatic Sync**: Fetches and stores new tokens every 10 seconds
- **Filtered Data**: Only stores tokens with `requestor_fid = 1049503`
- **Duplicate Handling**: Updates existing tokens instead of creating duplicates
- **Real-time Monitoring**: Web interface to monitor sync status and control the process
- **Error Handling**: Comprehensive error logging and recovery
- **Performance Optimized**: Indexed database for fast queries

## 📋 Prerequisites

1. A Supabase account and project
2. Node.js and pnpm installed
3. The Tally Clank project set up

## 🛠️ Setup Instructions

### 1. Supabase Setup

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API keys

2. **Run the Database Schema**:
   - In your Supabase dashboard, go to the SQL Editor
   - Copy and paste the contents of `sql/create_clanker_tokens_table.sql`
   - Run the SQL to create the table and indexes

### 2. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Existing variables (keep these)
PINATA_JWT=your_pinata_jwt_here
PINATA_GATEWAY_URL=orange-electronic-iguana-442.mypinata.cloud
CLANKER_API_KEY=tally-clank-nlv03n8n20fn09n9c2n081

# New Supabase variables (add these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: For server-side operations with elevated privileges
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Finding Your Supabase Keys**:
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the "Project URL" and "anon/public" key
4. Optionally copy the "service_role" key for server operations

### 3. Install Dependencies

The Supabase client is already installed. If you need to reinstall:

```bash
pnpm add @supabase/supabase-js
```

### 4. Database Table Schema

The system creates a table called `clanker_tokens` with the following structure:

```sql
-- Main columns
id BIGINT PRIMARY KEY                 -- Clanker API token ID
created_at TIMESTAMPTZ               -- When token was created on Clanker
deployed_at TIMESTAMPTZ              -- When token was deployed
tx_hash TEXT                         -- Transaction hash
contract_address TEXT UNIQUE         -- Token contract address
name TEXT                           -- Token name
symbol TEXT                         -- Token symbol
supply TEXT                         -- Token supply
img_url TEXT                        -- Token image URL
pool_address TEXT                   -- Uniswap pool address
requestor_fid BIGINT                -- Farcaster ID (filtered to 1049503)
starting_market_cap DECIMAL         -- Initial market cap
inserted_at TIMESTAMPTZ             -- When inserted in our DB
updated_at TIMESTAMPTZ              -- When last updated in our DB

-- JSON fields for complex data
metadata JSONB                      -- Token metadata
deploy_config JSONB                 -- Deployment configuration
social_context JSONB                -- Social media context
pool_config JSONB                   -- Pool configuration
warnings JSONB                      -- Warning flags
```

## 🔄 How the Sync Works

### Automatic Sync Process

1. **API Call**: Every 10 seconds, fetches latest tokens from `https://www.clanker.world/api/tokens`
2. **Filtering**: Filters tokens where `requestor_fid === 1049503`
3. **Database Operations**:
   - **New tokens**: Inserts into database
   - **Existing tokens**: Updates with latest data
4. **Error Handling**: Logs errors but continues processing other tokens

### API Endpoints

#### `POST /api/sync/clanker-tokens`
Manually trigger a sync operation.

**Response**:
```json
{
  "message": "Sync completed successfully",
  "requestor_fid": 1049503,
  "total_tokens_checked": 100,
  "tokens_found": 5,
  "tokens_inserted": 2,
  "tokens_updated": 3,
  "timestamp": "2025-01-02T10:30:00.000Z"
}
```

#### `GET /api/sync/clanker-tokens`
Get current sync status and latest tokens.

**Response**:
```json
{
  "message": "Sync status retrieved successfully",
  "requestor_fid": 1049503,
  "total_tokens_stored": 25,
  "latest_tokens": [...],
  "timestamp": "2025-01-02T10:30:00.000Z"
}
```

## 🖥️ Web Interface

Access the sync management interface at `/database` in your application.

### Features

- **Start/Stop Auto-Sync**: Control the automatic 10-second polling
- **Manual Sync**: Trigger sync immediately
- **Real-time Status**: Shows running status, next sync time, and statistics
- **Sync Results**: Displays results from the last sync operation
- **Error Display**: Shows any sync errors with details

### Controls

- **Start Auto-Sync**: Begins polling every 10 seconds
- **Stop Auto-Sync**: Stops the automatic polling
- **Manual Sync**: Performs a one-time sync immediately

## 📊 Monitoring

### Database Indexes

The system creates several indexes for optimal performance:

- `requestor_fid` - For filtering tokens
- `created_at` - For time-based queries
- `contract_address` - For unique token lookups
- `symbol` - For symbol-based searches
- `chain_id` - For blockchain filtering

### Automatic Timestamps

- `inserted_at`: Automatically set when a record is first created
- `updated_at`: Automatically updated when a record is modified

## 🛠️ Development

### Testing the Sync

1. Start your development server:
```bash
pnpm dev
```

2. Navigate to `/database` in your browser

3. Click "Start Auto-Sync" to begin the process

4. Monitor the sync status and results in real-time

### Manual Testing

You can also test the API endpoints directly:

```bash
# Trigger a manual sync
curl -X POST http://localhost:3000/api/sync/clanker-tokens

# Check sync status
curl http://localhost:3000/api/sync/clanker-tokens
```

## 🔍 Troubleshooting

### Common Issues

1. **Supabase Connection Error**:
   - Check your environment variables
   - Verify your Supabase project is active
   - Ensure the database table exists

2. **Clanker API Error**:
   - Verify the API key is correct
   - Check if the Clanker API is accessible
   - Look for rate limiting issues

3. **No Tokens Found**:
   - The system only stores tokens with `requestor_fid = 1049503`
   - Check if there are recent tokens with this FID in the Clanker API

### Debugging

Check the browser console and terminal logs for detailed error messages. The sync process includes comprehensive logging:

- `🔄` Starting sync
- `📊` Tokens found
- `🆕` New tokens inserted
- `✅` Existing tokens updated
- `✨` Sync completed
- `❌` Errors

## 📈 Performance

- **Sync Frequency**: 10 seconds (configurable in code)
- **API Limit**: Fetches up to 100 tokens per request
- **Database**: Optimized with indexes for fast queries
- **Memory**: Minimal footprint with efficient data handling

## 🔒 Security

- Uses Supabase Row Level Security (RLS) if enabled
- API keys stored in environment variables
- No sensitive data exposed in client-side code
- Proper error handling prevents data leakage

## 📝 Next Steps

1. Set up your Supabase project and database
2. Configure environment variables
3. Run the database schema
4. Start the sync process from `/database`
5. Monitor the sync status and results

For any issues or questions, check the logs and error messages for detailed information. 