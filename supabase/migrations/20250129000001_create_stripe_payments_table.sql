-- Create stripe_payments table to track Stripe payments and subscriptions

CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  event_type TEXT NOT NULL,
  event_id TEXT UNIQUE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_payments_user_id ON stripe_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_subscription_id ON stripe_payments(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_event_id ON stripe_payments(event_id);

COMMENT ON TABLE stripe_payments IS 'Tracks Stripe payment events and subscription transactions';
COMMENT ON COLUMN stripe_payments.event_id IS 'Stripe event ID for idempotency - ensures events are only processed once';
COMMENT ON COLUMN stripe_payments.metadata IS 'Additional Stripe event metadata stored as JSON';

