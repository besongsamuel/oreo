-- Add "failed" status to objectives
-- This migration updates the status constraint and the status update function

-- Step 1: Drop the existing check constraint
ALTER TABLE company_objectives 
DROP CONSTRAINT IF EXISTS company_objectives_status_check;

-- Step 2: Add the new check constraint with "failed" status
ALTER TABLE company_objectives
ADD CONSTRAINT company_objectives_status_check 
CHECK (status IN ('not_started', 'in_progress', 'achieved', 'overdue', 'failed'));

-- Step 3: Update existing "overdue" objectives to "failed" if they haven't been achieved
UPDATE company_objectives
SET status = 'failed'
WHERE status = 'overdue'
  AND end_date < CURRENT_DATE
  AND id IN (
    SELECT id FROM company_objectives co
    WHERE co.status = 'overdue'
    AND (SELECT calculate_objective_progress(co.id)) < 100
  );

-- Step 4: Update the function to set status to "failed" instead of "overdue"
CREATE OR REPLACE FUNCTION update_objective_status()
RETURNS TRIGGER AS $$
DECLARE
  v_progress DECIMAL(5, 2);
  v_current_date DATE;
  v_new_status TEXT;
BEGIN
  v_current_date := CURRENT_DATE;
  v_progress := calculate_objective_progress(NEW.id);
  
  -- Determine status based on progress and dates
  IF v_progress >= 100 THEN
    v_new_status := 'achieved';
  ELSIF v_current_date < NEW.start_date THEN
    v_new_status := 'not_started';
  ELSIF v_current_date > NEW.end_date AND v_progress < 100 THEN
    v_new_status := 'failed';
  ELSIF v_progress > 0 THEN
    v_new_status := 'in_progress';
  ELSE
    v_new_status := 'not_started';
  END IF;
  
  -- Only update if status changed
  IF NEW.status != v_new_status THEN
    NEW.status := v_new_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_objective_status() IS 'Updates objective status based on dates and progress. Sets status to "failed" when end_date has passed and progress < 100%';

