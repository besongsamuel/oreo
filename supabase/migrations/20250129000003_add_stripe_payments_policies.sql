-- Add RLS policies for stripe_payments table

-- Enable RLS
ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own payment records
CREATE POLICY "Users can view own payments"
  ON stripe_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Only service role can insert payment records (via webhook)
-- This is handled by webhook using service role key, so we don't need an insert policy for users
-- The webhook will use service role, bypassing RLS

-- Policy: Only service role can update payment records
-- Updates are handled via service role in webhook

COMMENT ON POLICY "Users can view own payments" ON stripe_payments IS 'Allows users to view their own payment history';

