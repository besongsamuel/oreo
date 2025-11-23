-- Remove start_date and end_date from objectives
-- Objectives will now use client-side timespan selection (year + quarter)

-- Step 1: Drop the index on end_date
DROP INDEX IF EXISTS idx_company_objectives_company_id_end_date;

-- Step 2: Update the update_objective_status() function to remove date-based logic
-- Status will now only depend on progress
CREATE OR REPLACE FUNCTION update_objective_status()
RETURNS TRIGGER AS $$
DECLARE
  v_progress DECIMAL(5, 2);
  v_new_status TEXT;
BEGIN
  -- Calculate progress (this will be done client-side now, but keep function for legacy)
  -- For now, just set status based on progress if it exists
  -- If progress is provided in the update, use it; otherwise keep existing logic simplified
  
  -- Determine status based only on progress
  -- Note: Progress calculation is now client-side, so this function may not be used
  -- But we'll keep it simple for backward compatibility
  IF NEW.status IS NULL OR NEW.status = '' THEN
    v_new_status := 'not_started';
  ELSE
    v_new_status := NEW.status;
  END IF;
  
  -- If progress is being set, update status accordingly
  -- Since progress calculation is client-side, we'll keep status as-is unless explicitly set
  
  NEW.status := COALESCE(NEW.status, 'not_started');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_objective_status() IS 'Updates objective status. Progress calculation is now done client-side. Status defaults to not_started if not set.';

-- Step 3: Remove NOT NULL constraint from start_date and end_date before dropping
ALTER TABLE company_objectives 
  ALTER COLUMN start_date DROP NOT NULL,
  ALTER COLUMN end_date DROP NOT NULL;

-- Step 4: Drop the columns
ALTER TABLE company_objectives 
  DROP COLUMN IF EXISTS start_date,
  DROP COLUMN IF EXISTS end_date;

