-- Add subscription fields to profiles table

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'paid'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_reviews_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_reviews_reset_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN profiles.subscription_tier IS 'User subscription tier: free or paid';
COMMENT ON COLUMN profiles.subscription_started_at IS 'When the subscription was started';
COMMENT ON COLUMN profiles.subscription_expires_at IS 'When the subscription expires';
COMMENT ON COLUMN profiles.monthly_reviews_count IS 'Number of reviews fetched this month';
COMMENT ON COLUMN profiles.monthly_reviews_reset_at IS 'When to reset the monthly review count';

