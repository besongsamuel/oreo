-- Add metadata column to platform_connections table
-- This will store Zembra and other platform-specific metadata

ALTER TABLE platform_connections 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index on metadata for efficient queries
CREATE INDEX IF NOT EXISTS idx_platform_connections_metadata 
ON platform_connections USING gin(metadata);

-- Add comment
COMMENT ON COLUMN platform_connections.metadata IS 'JSON metadata for platform-specific data (e.g., Zembra job info, fetch times, etc.)';

