-- Add Stripe-related fields to profiles table

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID associated with this user';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe subscription ID for the paid subscription';

