-- Simplify RLS policies to prevent any potential deadlocks

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create simple, non-conflicting policies
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure service_role can do everything (for triggers)
GRANT ALL ON public.profiles TO service_role;

COMMENT ON POLICY "profiles_select_own" ON profiles IS 'Users can view their own profile';
COMMENT ON POLICY "profiles_insert_own" ON profiles IS 'Users can create their own profile';
COMMENT ON POLICY "profiles_update_own" ON profiles IS 'Users can update their own profile';
