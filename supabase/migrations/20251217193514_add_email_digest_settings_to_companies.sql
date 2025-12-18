-- Add email digest settings to companies table
-- These columns control whether weekly and monthly digest emails are sent for each company

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS weekly_digest_enabled BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS monthly_digest_enabled BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN companies.weekly_digest_enabled IS 'Whether weekly digest emails are enabled for this company. Defaults to false (disabled).';
COMMENT ON COLUMN companies.monthly_digest_enabled IS 'Whether monthly digest emails are enabled for this company. Defaults to false (disabled).';
