-- Update free plan review limit from 15 to 25
-- Zembra requires a minimum sizeLimit of 25

DO $$
DECLARE
  free_plan_id UUID;
  max_reviews_sync_id UUID;
BEGIN
  -- Get plan and feature IDs
  SELECT id INTO free_plan_id FROM subscription_plans WHERE name = 'free';
  SELECT id INTO max_reviews_sync_id FROM features WHERE code = 'max_reviews_per_sync';
  
  -- Update the limit value to 25 (minimum required by Zembra)
  UPDATE plan_features
  SET limit_value = '{"max_reviews_per_sync": 25}'::jsonb
  WHERE plan_id = free_plan_id
    AND feature_id = max_reviews_sync_id;
END $$;


