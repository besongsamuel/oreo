-- Enable pg_cron extension and create scheduled job to expire trials

-- Enable pg_cron extension (requires superuser, may need to run manually in Supabase dashboard)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to expire trials and revert users to free plan
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER := 0;
  free_plan_id UUID;
  trial_record RECORD;
BEGIN
  -- Get free plan ID
  SELECT id INTO free_plan_id
  FROM subscription_plans
  WHERE name = 'free'
  LIMIT 1;

  IF free_plan_id IS NULL THEN
    RAISE EXCEPTION 'Free plan not found';
  END IF;

  -- Find all active trials that have expired
  FOR trial_record IN
    SELECT id, user_id
    FROM trial_trials
    WHERE status = 'active'
    AND expires_at < NOW()
  LOOP
    -- Update trial status to expired
    UPDATE trial_trials
    SET status = 'expired', updated_at = NOW()
    WHERE id = trial_record.id;

    -- Revert user to free plan (only if they're still on the trial plan)
    UPDATE profiles
    SET subscription_plan_id = free_plan_id,
        updated_at = NOW()
    WHERE id = trial_record.user_id
    AND subscription_plan_id = (
      SELECT trial_plan_id
      FROM trial_trials
      WHERE id = trial_record.id
    );

    expired_count := expired_count + 1;
  END LOOP;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_trials() IS 'Expires active trials that have passed their expiration date and reverts users to free plan';

-- Schedule cron job to run daily at midnight UTC
-- Note: This requires superuser privileges. In Supabase, you may need to run this manually in the dashboard SQL editor
SELECT cron.schedule(
  'expire-trials',
  '0 0 * * *', -- Run daily at midnight UTC
  'SELECT expire_trials();'
);

