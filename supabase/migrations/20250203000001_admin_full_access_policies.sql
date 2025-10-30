-- Admin full access RLS policies
-- Grants admins (profiles.role = 'admin') full SELECT/INSERT/UPDATE/DELETE access
-- across core tables by leveraging is_admin(auth.uid()).

-- Safety: make sure the helper exists
-- Note: function is created in 20250201000005_create_plan_check_functions.sql
-- CREATE OR REPLACE FUNCTION is_admin(user_id UUID) RETURNS BOOLEAN ...

-- Helper macro comment:
-- For each table, enable RLS (if not already) and add a single policy
-- that allows admins to perform all operations. The WITH CHECK mirrors USING
-- so mutations are allowed too.

-- Companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_full_access_companies" ON companies;
CREATE POLICY "admin_full_access_companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_full_access_locations" ON locations;
CREATE POLICY "admin_full_access_locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Profiles
-- Admins can view and manage any profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_full_access_profiles" ON profiles;
CREATE POLICY "admin_full_access_profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Trials (table may not exist in all environments)
DO $$
BEGIN
  IF to_regclass('public.trials') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE trials ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "admin_full_access_trials" ON trials';
    EXECUTE 'CREATE POLICY "admin_full_access_trials" ON trials FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()))';
  END IF;
END $$;

-- Plans and Features catalog tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_full_access_subscription_plans" ON subscription_plans;
CREATE POLICY "admin_full_access_subscription_plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

ALTER TABLE features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_full_access_features" ON features;
CREATE POLICY "admin_full_access_features"
  ON features
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_full_access_plan_features" ON plan_features;
CREATE POLICY "admin_full_access_plan_features"
  ON plan_features
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Optional: reviews table if present
DO $$
BEGIN
  IF to_regclass('public.reviews') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE reviews ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "admin_full_access_reviews" ON reviews';
    EXECUTE 'CREATE POLICY "admin_full_access_reviews" ON reviews FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()))';
  END IF;
END $$;

-- Notes:
-- 1) These policies complement existing user-scoped policies and limits.
-- 2) Admins also bypass company/location limits via existing check functions.
-- 3) Views (e.g., plans_with_features) inherit RLS from underlying tables; no direct policies can be applied to views.


