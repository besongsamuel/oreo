-- Create plan_features junction table

CREATE TABLE IF NOT EXISTS plan_features (
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  limit_value JSONB,
  PRIMARY KEY (plan_id, feature_id)
);

COMMENT ON TABLE plan_features IS 'Junction table mapping subscription plans to features with optional limits';
COMMENT ON COLUMN plan_features.limit_value IS 'JSONB storing numeric limits (e.g., {"max_companies": 1, "max_locations_per_company": 3})';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_feature_id ON plan_features(feature_id);

-- Seed plan-feature mappings
DO $$
DECLARE
  free_plan_id UUID;
  pro_plan_id UUID;
  enterprise_plan_id UUID;
  monthly_summary_id UUID;
  multiple_companies_id UUID;
  max_companies_id UUID;
  max_locations_id UUID;
  max_reviews_sync_id UUID;
  unlimited_reviews_id UUID;
BEGIN
  -- Get plan IDs
  SELECT id INTO free_plan_id FROM subscription_plans WHERE name = 'free';
  SELECT id INTO pro_plan_id FROM subscription_plans WHERE name = 'pro';
  SELECT id INTO enterprise_plan_id FROM subscription_plans WHERE name = 'enterprise';
  
  -- Get feature IDs
  SELECT id INTO monthly_summary_id FROM features WHERE code = 'monthly_summary';
  SELECT id INTO multiple_companies_id FROM features WHERE code = 'multiple_companies';
  SELECT id INTO max_companies_id FROM features WHERE code = 'max_companies';
  SELECT id INTO max_locations_id FROM features WHERE code = 'max_locations_per_company';
  SELECT id INTO max_reviews_sync_id FROM features WHERE code = 'max_reviews_per_sync';
  SELECT id INTO unlimited_reviews_id FROM features WHERE code = 'unlimited_reviews';
  
  -- Free plan features
  INSERT INTO plan_features (plan_id, feature_id, limit_value)
  VALUES 
    (free_plan_id, max_companies_id, '{"max_companies": 1}'::jsonb),
    (free_plan_id, max_reviews_sync_id, '{"max_reviews_per_sync": 15}'::jsonb)
  ON CONFLICT (plan_id, feature_id) DO NOTHING;
  
  -- Pro plan features
  INSERT INTO plan_features (plan_id, feature_id, limit_value)
  VALUES 
    (pro_plan_id, max_companies_id, '{"max_companies": 1}'::jsonb),
    (pro_plan_id, max_locations_id, '{"max_locations_per_company": 3}'::jsonb),
    (pro_plan_id, unlimited_reviews_id, NULL),
    (pro_plan_id, monthly_summary_id, NULL)
  ON CONFLICT (plan_id, feature_id) DO NOTHING;
  
  -- Enterprise plan features
  INSERT INTO plan_features (plan_id, feature_id, limit_value)
  VALUES 
    (enterprise_plan_id, max_companies_id, '{"max_companies": 5}'::jsonb),
    (enterprise_plan_id, max_locations_id, '{"max_locations_per_company": 3}'::jsonb),
    (enterprise_plan_id, unlimited_reviews_id, NULL),
    (enterprise_plan_id, monthly_summary_id, NULL),
    (enterprise_plan_id, multiple_companies_id, NULL)
  ON CONFLICT (plan_id, feature_id) DO NOTHING;
END $$;

