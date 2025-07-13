# Tally Clank

Tally Clank is a real-time token sniping and deployment platform built to solve major limitations in the [Clanker.world](https://clanker.world) ecosystem. It gives users the ability to buy newly launched tokens instantly, automate their buys, and even launch tokens directly on the Base blockchain — all from a single, easy-to-use interface.

---

## Features

### 1. Real-Time Token Visibility
- Displays every new token launch from Clanker instantly.
- Helps users identify opportunities without delay.

### 2. Instant Buy in Two Clicks
- Allows users to buy newly launched tokens with just two clicks.
- Eliminates the need for manual contract entry and switching tools.

### 3. Auto-Buy Configuration
- Users can pre-set token name or symbol.
- When the token launches, Tally Clank detects it and executes a buy automatically.

### 4. Token Creation
- Deploy tokens directly to the Base blockchain.
- Simple, no-code interface designed for creators.
- Fast and secure token deployment.

### 5. Fair Launch Advantage
- Helps regular users compete with bots.
- Ensures everyone gets a chance to enter early.

---

## Impact

- **$297,000+** total volume generated since launch.
- **$5,000** reward funding granted by the Clanker founder.
- Adopted and recognized by top developers and influencers in the ecosystem.

---

## Tech Stack

- **Frontend:** React.js  
- **Backend:** Node.js  
- **Blockchain:** Base (EVM-compatible)  
- **Integrations:** Clanker API, Web3, EVM RPC  
- **Hosting:** Vercel

---

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tallyclank.git
```

2. Install dependencies:
```bash
cd tallyclank
npm install
```

3. Set up environment variables in `.env.local`:
```env
NEXT_PUBLIC_RPC_URL=your_rpc_url
CLANKER_API_URL=https://api.clanker.world
```

4. Run the development server:
```bash
npm run dev
```

---

## Links

- [Live Platform](https://tallyclank.fun/)  
- [Clanker.world](https://clanker.world/)  
- [Base Blockchain](https://base.org/)

---

## License

This project is licensed under the MIT License.

---

## Contact

For support or collaboration, reach out via X (Twitter) at(https://twitter.com/yourhandle)


# 🚀 Clanker Database Sync - Quick Setup Summary

## ✅ What's Been Implemented

1. **Supabase Integration**: Complete database setup with TypeScript types
2. **API Sync Route**: `/api/sync/clanker-tokens` for fetching and storing data
3. **Web Interface**: `/database` page for monitoring and controlling sync
4. **Automatic Sync**: 10-second polling with start/stop controls
5. **Navigation Links**: Added database management to both desktop and mobile nav
6. **Documentation**: Complete setup and usage documentation

## 🔧 Quick Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project initialization (2-3 minutes)

### 2. Set Up Database
1. In Supabase dashboard, go to SQL Editor
2. Copy/paste the SQL from `sql/create_clanker_tokens_table.sql`
3. Click "Run" to create the table and indexes

### 3. Configure Environment Variables
Create `.env.local` in your project root:

```env
# Existing variables (keep these)
PINATA_JWT=your_existing_jwt
PINATA_GATEWAY_URL=orange-electronic-iguana-442.mypinata.cloud
CLANKER_API_KEY=tally-clank-nlv03n8n20fn09n9c2n081

# Add these new Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get your keys from**: Supabase Dashboard → Settings → API

### 4. Start the Application
```bash
pnpm dev
```

### 5. Access Database Management
- Desktop: Click "Database" in the left sidebar
- Mobile: Scroll down to see "Database Management" button
- Direct URL: `http://localhost:3000/database`

## 🎯 How to Use

1. **Navigate to `/database`** in your browser
2. **Click "Start Auto-Sync"** to begin automatic polling every 10 seconds
3. **Monitor the status** in real-time:
   - Running status (Running/Stopped)
   - Total tokens stored in database
   - Last sync time and results
   - Next sync countdown

## 📊 What Gets Stored

- **Only tokens where `requestor_fid = 1049503`** are stored
- **All Clanker API data**: contract addresses, metadata, pool info, etc.
- **Automatic deduplication**: Updates existing tokens instead of creating duplicates
- **Timestamping**: Tracks when data was inserted and last updated

## 🔍 Verification

After setup, you should see:
- Sync status showing "Running" when active
- Token count increasing as data is found
- Sync results showing tokens inserted/updated
- No errors in the sync results

## 📚 Documentation

- **Complete Guide**: `README-DATABASE-SYNC.md`
- **Database Schema**: `sql/create_clanker_tokens_table.sql`
- **API Endpoints**: `/api/sync/clanker-tokens` (GET/POST)

## 🆘 Need Help?

1. **Check the browser console** for error messages
2. **Check the server logs** in your terminal
3. **Verify environment variables** are set correctly
4. **Ensure Supabase project is active** and table exists
5. **Test API endpoints manually** using curl or browser dev tools

## 🎉 You're All Set!

Once configured, the system will automatically:
- ✅ Fetch new tokens every 10 seconds
- ✅ Store only your tokens (requestor_fid = 1049503) 
- ✅ Update existing tokens with latest data
- ✅ Provide real-time monitoring
- ✅ Handle errors gracefully

Navigate to `/database` and click "Start Auto-Sync" to begin! 
