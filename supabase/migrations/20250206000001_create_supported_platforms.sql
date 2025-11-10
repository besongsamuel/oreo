-- Create supported_platforms table
-- This table contains all platforms supported by Zembra

CREATE TABLE IF NOT EXISTS supported_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description_en TEXT,
  description_fr TEXT,
  icon_url TEXT,
  base_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE supported_platforms IS 'All review platforms supported by Zembra API';
COMMENT ON COLUMN supported_platforms.name IS 'Unique slug identifier (e.g., "facebook", "google", "yelp")';
COMMENT ON COLUMN supported_platforms.display_name IS 'User-facing platform name';
COMMENT ON COLUMN supported_platforms.description_en IS 'English description of how to find the slug/ID';
COMMENT ON COLUMN supported_platforms.description_fr IS 'French description of how to find the slug/ID';
COMMENT ON COLUMN supported_platforms.is_active IS 'Whether this platform is currently available';

-- Create index on name for fast lookups
CREATE INDEX IF NOT EXISTS idx_supported_platforms_name ON supported_platforms(name);
CREATE INDEX IF NOT EXISTS idx_supported_platforms_is_active ON supported_platforms(is_active);






