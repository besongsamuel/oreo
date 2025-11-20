-- Add max_platforms feature and map to subscription plans

-- Insert the max_platforms feature
INSERT INTO features (code, display_name, description)
VALUES 
  ('max_platforms', 'Platform Selection Limit', 'Maximum number of platforms a user can select based on their subscription plan')
ON CONFLICT (code) DO NOTHING;

-- Map feature to plans with limits
DO $$
DECLARE
  free_plan_id UUID;
  pro_plan_id UUID;
  enterprise_plan_id UUID;
  max_platforms_id UUID;
BEGIN
  -- Get plan IDs
  SELECT id INTO free_plan_id FROM subscription_plans WHERE name = 'free';
  SELECT id INTO pro_plan_id FROM subscription_plans WHERE name = 'pro';
  SELECT id INTO enterprise_plan_id FROM subscription_plans WHERE name = 'enterprise';
  
  -- Get feature ID
  SELECT id INTO max_platforms_id FROM features WHERE code = 'max_platforms';
  
  -- Free plan: 3 platforms
  INSERT INTO plan_features (plan_id, feature_id, limit_value)
  VALUES 
    (free_plan_id, max_platforms_id, '{"max_platforms": 3}'::jsonb)
  ON CONFLICT (plan_id, feature_id) DO UPDATE
    SET limit_value = '{"max_platforms": 3}'::jsonb;
  
  -- Pro plan: 5 platforms
  INSERT INTO plan_features (plan_id, feature_id, limit_value)
  VALUES 
    (pro_plan_id, max_platforms_id, '{"max_platforms": 5}'::jsonb)
  ON CONFLICT (plan_id, feature_id) DO UPDATE
    SET limit_value = '{"max_platforms": 5}'::jsonb;
  
  -- Enterprise plan: 10 platforms
  INSERT INTO plan_features (plan_id, feature_id, limit_value)
  VALUES 
    (enterprise_plan_id, max_platforms_id, '{"max_platforms": 10}'::jsonb)
  ON CONFLICT (plan_id, feature_id) DO UPDATE
    SET limit_value = '{"max_platforms": 10}'::jsonb;
END $$;










