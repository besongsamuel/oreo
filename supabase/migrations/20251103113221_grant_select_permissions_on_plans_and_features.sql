-- Grant SELECT permissions on subscription plans, features, and plan_features
-- This allows all users (authenticated and anonymous) to view available plans and features

-- Grant table-level SELECT permissions
GRANT SELECT ON subscription_plans TO anon, authenticated;
GRANT SELECT ON features TO anon, authenticated;
GRANT SELECT ON plan_features TO anon, authenticated;

-- Create RLS policies to allow SELECT for all users
-- These tables should be readable by everyone since they contain catalog data

-- Subscription Plans: Allow everyone to view all active plans
DROP POLICY IF EXISTS "public_read_subscription_plans" ON subscription_plans;
CREATE POLICY "public_read_subscription_plans"
  ON subscription_plans
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Features: Allow everyone to view all features
DROP POLICY IF EXISTS "public_read_features" ON features;
CREATE POLICY "public_read_features"
  ON features
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Plan Features: Allow everyone to view plan-feature mappings
DROP POLICY IF EXISTS "public_read_plan_features" ON plan_features;
CREATE POLICY "public_read_plan_features"
  ON plan_features
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Add comments for documentation
COMMENT ON POLICY "public_read_subscription_plans" ON subscription_plans IS 
  'Allows all users to view available subscription plans for pricing pages';
COMMENT ON POLICY "public_read_features" ON features IS 
  'Allows all users to view available features for plan comparison';
COMMENT ON POLICY "public_read_plan_features" ON plan_features IS 
  'Allows all users to view which features are included in each plan';

