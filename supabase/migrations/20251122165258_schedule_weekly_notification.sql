-- Schedule weekly-notification edge function to run weekly

-- Enable pg_net extension (required for making HTTP requests from cron)
-- Note: This requires superuser privileges. In Supabase, you may need to run this manually in the dashboard SQL editor
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Store project URL and anon key in Supabase Vault for secure access
-- IMPORTANT: Before running this migration, you MUST update the placeholder values below
-- with your actual project values:
--
--   1. Replace 'https://your-project-ref.supabase.co' with your actual Supabase project URL
--   2. Replace 'YOUR_SUPABASE_ANON_KEY' with your actual Supabase anonymous key
--
-- You can find these values in your Supabase dashboard:
--   - Project URL: Settings > API > Project URL
--   - Anon Key: Settings > API > Project API keys > anon/public
--
-- Note: If the secrets already exist, you may need to delete them first in the Supabase dashboard
-- or update them manually. The vault.create_secret function will fail if a secret with the same
-- name already exists.

-- Create project_url secret
-- TODO: Replace 'https://your-project-ref.supabase.co' with your actual project URL
SELECT vault.create_secret('https://obwpbnpwwgmbirvjdzwo.supabase.co', 'project_url');

-- Create anon_key secret  
-- TODO: Replace 'YOUR_SUPABASE_ANON_KEY' with your actual Supabase anon key
SELECT vault.create_secret('sb_publishable_fR6zjBZ4QtGhIeW8F-U_aA_LjfCOkno', 'anon_key');

-- Schedule the weekly-notification edge function to run weekly
-- Cron expression: '0 9 * * 1' means Monday at 9:00 AM UTC
-- Note: This requires superuser privileges. In Supabase, you may need to run this manually in the dashboard SQL editor
SELECT cron.schedule(
  'weekly-notification',
  '0 9 * * 1', -- Run every Monday at 9:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/weekly-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
      ),
      body := jsonb_build_object('time', now())
    ) as request_id;
  $$
);

COMMENT ON TABLE cron.job IS 'Weekly notification cron job runs every Monday at 9:00 AM UTC';

