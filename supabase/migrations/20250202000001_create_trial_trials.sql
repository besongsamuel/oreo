-- Create trial_trials table to track trial subscription history

CREATE TABLE IF NOT EXISTS trial_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  trial_plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trial_trials_user_id ON trial_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_trials_expires_at ON trial_trials(expires_at);
CREATE INDEX IF NOT EXISTS idx_trial_trials_status ON trial_trials(status);
CREATE INDEX IF NOT EXISTS idx_trial_trials_granted_by ON trial_trials(granted_by);

-- Add comments
COMMENT ON TABLE trial_trials IS 'Tracks trial subscription grants and history';
COMMENT ON COLUMN trial_trials.user_id IS 'User who received the trial';
COMMENT ON COLUMN trial_trials.granted_by IS 'Admin user who granted the trial';
COMMENT ON COLUMN trial_trials.trial_plan_id IS 'Subscription plan granted for the trial';
COMMENT ON COLUMN trial_trials.status IS 'Trial status: active, expired, or cancelled';

-- Enable RLS
ALTER TABLE trial_trials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can view all trials
CREATE POLICY "Admins can view all trials"
  ON trial_trials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert trials
CREATE POLICY "Admins can insert trials"
  ON trial_trials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update trials
CREATE POLICY "Admins can update trials"
  ON trial_trials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own trials
CREATE POLICY "Users can view their own trials"
  ON trial_trials FOR SELECT
  USING (user_id = auth.uid());

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_trial_trials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trial_trials_updated_at
  BEFORE UPDATE ON trial_trials
  FOR EACH ROW
  EXECUTE FUNCTION update_trial_trials_updated_at();

