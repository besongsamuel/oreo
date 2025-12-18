-- Schedule email notification edge functions to run via cron
-- Note: This requires superuser privileges. In Supabase, you may need to run this manually in the dashboard SQL editor
-- The vault secrets (project_url and anon_key) should already exist from previous migrations

-- Schedule the send-weekly-digest edge function to run weekly
-- Cron expression: '0 8 * * 1' means Monday at 8:00 AM UTC
-- Note: The function will automatically skip if it's the first Monday of the month (Monthly Report week)
SELECT cron.schedule(
  'send-weekly-digest',
  '0 8 * * 1', -- Run every Monday at 8:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/send-weekly-digest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
      ),
      body := jsonb_build_object('trigger', 'cron')
    ) as request_id;
  $$
);

-- Schedule the send-monthly-report edge function to run monthly
-- Cron expression: '0 8 1 * *' means 1st of each month at 8:00 AM UTC
SELECT cron.schedule(
  'send-monthly-report',
  '0 8 1 * *', -- Run on the 1st of each month at 8:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/send-monthly-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
      ),
      body := jsonb_build_object('trigger', 'cron')
    ) as request_id;
  $$
);

-- Note: 
-- - Weekly digest cron job runs every Monday at 8:00 AM UTC
-- - Monthly report cron job runs on the 1st of each month at 8:00 AM UTC
-- - The cron.job table is managed by pg_cron extension and cannot be commented without superuser privileges
-- - Both functions will skip sending if total review count for the period is 0
-- - Weekly digest will skip if it's the first Monday of the month (when monthly report is sent)
