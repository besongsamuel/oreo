-- Drop the instructions column from platforms table
-- Instructions will now be stored in the frontend code

ALTER TABLE platforms 
DROP COLUMN IF EXISTS instructions;

