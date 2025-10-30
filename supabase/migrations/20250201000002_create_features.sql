-- Create features table

CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE features IS 'Available features that can be assigned to subscription plans';
COMMENT ON COLUMN features.code IS 'Unique feature identifier (e.g., monthly_summary, multiple_companies)';
COMMENT ON COLUMN features.display_name IS 'User-facing favor name';
COMMENT ON COLUMN features.description IS 'Description of what the feature provides';

-- Create index on code for fast lookups
CREATE INDEX IF NOT EXISTS idx_features_code ON features(code);

-- Seed default features
INSERT INTO features (code, display_name, description)
VALUES 
  ('monthly_summary', 'Monthly Summary', 'Access to monthly summary generation'),
  ('multiple_companies', 'Multiple Companies', 'Ability to create more than 1 company'),
  ('max_companies', 'Company Limit', 'Maximum number of companies allowed'),
  ('max_locations_per_company', 'Location Limit', 'Maximum locations per company'),
  ('max_reviews_per_sync', 'Review Sync Limit', 'Maximum reviews fetched per sync from Zembra'),
  ('unlimited_reviews', 'Unlimited Reviews', 'No limit on reviews (paid plans)')
ON CONFLICT (code) DO NOTHING;

