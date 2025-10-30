-- Update profiles table to add subscription_plan_id and migrate existing data

-- Add subscription_plan_id column
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan_id ON profiles(subscription_plan_id);

-- Migrate existing users to appropriate plans
DO $$
DECLARE
  free_plan_id UUID;
  pro_plan_id UUID;
BEGIN
  -- Get plan IDs
  SELECT id INTO free_plan_id FROM subscription_plans WHERE name = 'free';
  SELECT id INTO pro_plan_id FROM subscription_plans WHERE name = 'pro';
  
  -- Set default to free plan for all users without a plan
  UPDATE profiles 
  SET subscription_plan_id = free_plan_id 
  WHERE subscription_plan_id IS NULL;
  
  -- Migrate paid users to pro plan (can be changed to enterprise later if needed)
  UPDATE profiles 
  SET subscription_plan_id = pro_plan_id 
  WHERE subscription_tier = 'paid' AND subscription_plan_id IS NULL OR subscription_plan_id = free_plan_id;
  
  -- Ensure free tier users are on free plan
  UPDATE profiles 
  SET subscription_plan_id = free_plan_id 
  WHERE subscription_tier = 'free' AND subscription_plan_id IS NULL;
END $$;

-- Add comment
COMMENT ON COLUMN profiles.subscription_plan_id IS 'Current subscription plan ID (references subscription_plans table)';

