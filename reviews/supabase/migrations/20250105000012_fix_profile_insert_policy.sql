-- Fix RLS policies for profiles table to allow users to insert/update their own profile

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Allow users to insert their own profile (for manual profile creation)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Also ensure update policy allows full_name and company_name updates
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

COMMENT ON POLICY "Users can insert own profile" ON profiles IS 'Allows users to create their own profile record';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Allows users to update their own profile information';
