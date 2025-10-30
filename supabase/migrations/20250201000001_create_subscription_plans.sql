-- Create subscription_plans table

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE subscription_plans IS 'Available subscription plans (free, pro, enterprise)';
COMMENT ON COLUMN subscription_plans.name IS 'Unique plan identifier: free, pro, enterprise';
COMMENT ON COLUMN subscription_plans.display_name IS 'User-facing plan name';
COMMENT ON COLUMN subscription_plans.price_monthly IS 'Monthly price in USD';
COMMENT ON COLUMN subscription_plans.stripe_price_id IS 'Stripe Price ID for paid plans';

-- Create index on name for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON subscription_plans(is_active);

-- Create updated_at trigger
CREATE TRIGGER update_subscription_plans_updated_at 
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default plans
INSERT INTO subscription_plans (name, display_name, price_monthly, stripe_price_id, is_active)
VALUES 
  ('free', 'Free', 0.00, NULL, true),
  ('pro', 'Pro', 49.99, NULL, true),
  ('enterprise', 'Enterprise', 99.00, NULL, true)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TRIGGER update_subscription_plans_updated_at ON subscription_plans IS 'Automatically updates updated_at timestamp on row update';

