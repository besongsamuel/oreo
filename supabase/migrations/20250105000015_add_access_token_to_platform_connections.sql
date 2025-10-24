-- Add access_token field to platform_connections table
-- This will store the page access token for Facebook and other platforms

ALTER TABLE platform_connections 
ADD COLUMN access_token TEXT;

COMMENT ON COLUMN platform_connections.access_token IS 'Platform-specific access token (e.g., Facebook page access token)';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_platform_connections_access_token 
ON platform_connections(access_token) 
WHERE access_token IS NOT NULL;
