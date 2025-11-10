-- Create user_platforms table
-- Links users to their selected platforms

CREATE TABLE IF NOT EXISTS user_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES supported_platforms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform_id)
);

COMMENT ON TABLE user_platforms IS 'User-selected platforms based on subscription plan limits';
COMMENT ON COLUMN user_platforms.user_id IS 'Reference to user profile';
COMMENT ON COLUMN user_platforms.platform_id IS 'Reference to supported platform';

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_user_platforms_user_id ON user_platforms(user_id);
CREATE INDEX IF NOT EXISTS idx_user_platforms_platform_id ON user_platforms(platform_id);






