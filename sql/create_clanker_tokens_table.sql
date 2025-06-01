-- Create the clanker_tokens table to store data from Clanker API
-- This table will store tokens where requestor_fid = 1049503

CREATE TABLE IF NOT EXISTS clanker_tokens (
  -- Primary key using the ID from Clanker API
  id BIGINT PRIMARY KEY,
  
  -- Timestamps from Clanker API
  created_at TIMESTAMPTZ NOT NULL,
  deployed_at TIMESTAMPTZ NOT NULL,
  
  -- Transaction and contract information
  tx_hash TEXT NOT NULL,
  contract_address TEXT NOT NULL UNIQUE,
  
  -- Token basic information
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  supply TEXT NOT NULL,
  img_url TEXT,
  
  -- Pool information
  pool_address TEXT NOT NULL,
  cast_hash TEXT NOT NULL,
  type TEXT NOT NULL,
  pair TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  
  -- JSON fields for complex data
  metadata JSONB NOT NULL DEFAULT '{}',
  deploy_config JSONB NOT NULL DEFAULT '{}',
  social_context JSONB NOT NULL DEFAULT '{}',
  pool_config JSONB NOT NULL DEFAULT '{}',
  warnings JSONB NOT NULL DEFAULT '[]',
  
  -- User and deployment information
  requestor_fid BIGINT NOT NULL,
  msg_sender TEXT NOT NULL,
  factory_address TEXT NOT NULL,
  locker_address TEXT NOT NULL,
  position_id TEXT,
  
  -- Market information
  starting_market_cap DECIMAL NOT NULL,
  
  -- Our local timestamps
  inserted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clanker_tokens_requestor_fid ON clanker_tokens(requestor_fid);
CREATE INDEX IF NOT EXISTS idx_clanker_tokens_created_at ON clanker_tokens(created_at);
CREATE INDEX IF NOT EXISTS idx_clanker_tokens_deployed_at ON clanker_tokens(deployed_at);
CREATE INDEX IF NOT EXISTS idx_clanker_tokens_contract_address ON clanker_tokens(contract_address);
CREATE INDEX IF NOT EXISTS idx_clanker_tokens_symbol ON clanker_tokens(symbol);
CREATE INDEX IF NOT EXISTS idx_clanker_tokens_chain_id ON clanker_tokens(chain_id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clanker_tokens_updated_at
    BEFORE UPDATE ON clanker_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add some comments for documentation
COMMENT ON TABLE clanker_tokens IS 'Stores token data from Clanker API for requestor_fid = 1049503';
COMMENT ON COLUMN clanker_tokens.requestor_fid IS 'Farcaster ID of the token requestor - filtered to 1049503';
COMMENT ON COLUMN clanker_tokens.contract_address IS 'Unique token contract address on the blockchain';
COMMENT ON COLUMN clanker_tokens.starting_market_cap IS 'Initial market capitalization in the quote token';
COMMENT ON COLUMN clanker_tokens.inserted_at IS 'When this record was first inserted into our database';
COMMENT ON COLUMN clanker_tokens.updated_at IS 'When this record was last updated in our database'; 