-- Add pass_score column to company_objectives table
-- This column determines the minimum score (0-100) required for an objective to pass
-- Default value is 100 (meaning 100% progress is required to pass)

ALTER TABLE company_objectives
ADD COLUMN IF NOT EXISTS pass_score DECIMAL(5, 2) DEFAULT 100 
CHECK (pass_score >= 0 AND pass_score <= 100);

-- Update existing rows to have pass_score = 100
UPDATE company_objectives
SET pass_score = 100
WHERE pass_score IS NULL;

-- Make pass_score NOT NULL after backfilling
ALTER TABLE company_objectives
ALTER COLUMN pass_score SET NOT NULL;

COMMENT ON COLUMN company_objectives.pass_score IS 'Minimum score (0-100) required for objective to pass. Default is 100.';

