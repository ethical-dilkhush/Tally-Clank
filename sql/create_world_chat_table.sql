-- Drop existing table if it exists (to start fresh)
DROP TABLE IF EXISTS world_chat;

-- Create world_chat table for storing chat messages
CREATE TABLE world_chat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL,
    message TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX world_chat_created_at_idx ON world_chat(created_at DESC);
CREATE INDEX world_chat_address_idx ON world_chat(address);

-- Enable Row Level Security
ALTER TABLE world_chat ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read messages" ON world_chat;
DROP POLICY IF EXISTS "Anyone can insert messages" ON world_chat;

-- Create policy to allow anyone to read messages
CREATE POLICY "Anyone can read messages" ON world_chat
    FOR SELECT USING (true);

-- Create policy to allow anyone to insert messages
CREATE POLICY "Anyone can insert messages" ON world_chat
    FOR INSERT WITH CHECK (true);

-- Create policy to allow anyone to delete messages (for testing)
CREATE POLICY "Anyone can delete messages" ON world_chat
    FOR DELETE USING (true);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_world_chat_updated_at ON world_chat;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_world_chat_updated_at 
    BEFORE UPDATE ON world_chat
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to anon and authenticated users
GRANT SELECT, INSERT, DELETE ON world_chat TO anon;
GRANT SELECT, INSERT, DELETE ON world_chat TO authenticated;

-- Insert a test message to verify everything works
INSERT INTO world_chat (address, message, display_name) 
VALUES ('0x0000000000000000000000000000000000000000', 'Welcome to World Chat!', '0x0000...0000');

-- Verify the table was created correctly
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'world_chat' 
ORDER BY ordinal_position;

-- Test that we can read from the table
SELECT * FROM world_chat LIMIT 1;

-- Add comments for documentation
COMMENT ON TABLE world_chat IS 'Table for storing world chat messages';
COMMENT ON COLUMN world_chat.address IS 'Wallet address of the message sender';
COMMENT ON COLUMN world_chat.message IS 'The chat message content';
COMMENT ON COLUMN world_chat.display_name IS 'Display name for the user (shortened wallet address)';
COMMENT ON COLUMN world_chat.created_at IS 'When the message was created';
COMMENT ON COLUMN world_chat.updated_at IS 'When the message was last updated'; 