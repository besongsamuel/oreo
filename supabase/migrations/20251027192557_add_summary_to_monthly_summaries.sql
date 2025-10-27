-- Add summary column to monthly_summaries table for AI-generated summaries

ALTER TABLE monthly_summaries
ADD COLUMN IF NOT EXISTS summary TEXT;

COMMENT ON COLUMN monthly_summaries.summary IS 'AI-generated 4-6 line summary of customer sentiment for the month';

