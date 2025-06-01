import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types for the clanker_tokens table
export interface ClankerToken {
  id: string
  created_at: string
  tx_hash: string
  contract_address: string
  name: string
  symbol: string
  supply: string
  img_url?: string
  pool_address: string
  cast_hash: string
  type: string
  pair: string
  chain_id: number
  metadata: {
    auditUrls: string[]
    description: string
    socialMediaUrls: string[]
  }
  deploy_config: {
    devBuyAmount: number
    lockupPercentage: number
    vestingUnlockDate: number
  }
  social_context: {
    interface: string
    platform?: string
    messageId: string
    id: string
  }
  requestor_fid: number
  deployed_at: string
  msg_sender: string
  factory_address: string
  locker_address: string
  position_id?: string
  warnings: string[]
  pool_config: {
    pairedToken: string
    tickIfToken0IsNewToken: number
  }
  starting_market_cap: number
  // Local timestamp when inserted into our database
  inserted_at?: string
  // Last time this record was updated
  updated_at?: string
} 