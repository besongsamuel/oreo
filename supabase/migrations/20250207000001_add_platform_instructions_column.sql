-- Add instructions column to platforms table
-- This column stores slug format instructions for each platform
ALTER TABLE platforms
ADD COLUMN IF NOT EXISTS instructions JSONB;

COMMENT ON COLUMN platforms.instructions IS 'JSON object containing slug format instructions including exampleUrl, acceptableFormats, patterns, and lowerCased flag';

