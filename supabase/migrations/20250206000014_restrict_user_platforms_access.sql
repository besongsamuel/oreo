-- Restrict user_platforms table access - only admins can modify
-- Users can only SELECT (read) their own platform selections
-- All INSERT/DELETE/UPDATE operations must go through edge functions

-- Drop user INSERT policy
DROP POLICY IF EXISTS "Users can insert their own platform selections" ON user_platforms;

-- Drop user DELETE policy
DROP POLICY IF EXISTS "Users can delete their own platform selections" ON user_platforms;

-- Keep user SELECT policy (users can read their own selections)
-- This policy already exists, so we don't need to recreate it

-- Keep all admin policies (they remain unchanged)
-- Admins can still perform all operations via direct database access

COMMENT ON TABLE user_platforms IS 'User platform selections. Users can only read their own selections. All modifications must go through the add-user-platforms edge function which enforces plan limits. Only admins have direct write access.';

