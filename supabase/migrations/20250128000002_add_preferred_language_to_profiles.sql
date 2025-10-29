-- Add preferred_language column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'fr' CHECK (preferred_language IN ('en', 'fr'));

COMMENT ON COLUMN profiles.preferred_language IS 'User preferred language for UI and AI-generated content';
