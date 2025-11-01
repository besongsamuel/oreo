-- Create rate limit tracking table for OpenAI API calls
CREATE TABLE IF NOT EXISTS openai_rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_openai_rate_limit_created_at 
  ON openai_rate_limit_log(created_at);

COMMENT ON TABLE openai_rate_limit_log IS 'Tracks OpenAI API requests for rate limiting across edge function invocations';

-- Create cleanup function to delete old entries (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_openai_rate_limit_log()
RETURNS void AS $$
BEGIN
  DELETE FROM openai_rate_limit_log
  WHERE created_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_openai_rate_limit_log() IS 'Removes old rate limit log entries to keep table size manageable';

-- Grant necessary permissions (service role can insert/select, cleanup can be run by service role)
-- No RLS needed as this is for internal rate limiting only

