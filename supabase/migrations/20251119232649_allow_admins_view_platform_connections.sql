-- Allow admins to view all platform_connections
-- This policy complements existing user-scoped policies that allow users
-- to view platform connections of their own locations
-- Uses the is_admin() helper function defined in 20250201000005_create_plan_check_functions.sql

CREATE POLICY "Admins can view all platform connections"
  ON platform_connections
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

COMMENT ON POLICY "Admins can view all platform connections" ON platform_connections IS 
  'Allows users with admin role to view all platform connections across all companies and locations';

