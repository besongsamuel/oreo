-- Deprecate supported_platforms table and migrate to platforms table
-- This migration:
-- 1. Adds description_en and description_fr columns to platforms
-- 2. Migrates all data from supported_platforms to platforms
-- 3. Updates user_platforms foreign key to reference platforms
-- 4. Clears and repopulates user_platforms with default platforms (facebook, yelp, google)

-- Step 1: Add description columns to platforms table
ALTER TABLE platforms 
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_fr TEXT;

COMMENT ON COLUMN platforms.description_en IS 'English description of how to find the slug/ID';
COMMENT ON COLUMN platforms.description_fr IS 'French description of how to find the slug/ID';

-- Step 2: Migrate data from supported_platforms to platforms
-- Match by name and update existing records, insert new ones
INSERT INTO platforms (name, display_name, description_en, description_fr, icon_url, base_url, is_active)
SELECT name, display_name, description_en, description_fr, icon_url, base_url, is_active
FROM supported_platforms
ON CONFLICT (name) DO UPDATE
SET display_name = EXCLUDED.display_name,
    description_en = EXCLUDED.description_en,
    description_fr = EXCLUDED.description_fr,
    icon_url = EXCLUDED.icon_url,
    base_url = EXCLUDED.base_url,
    is_active = EXCLUDED.is_active;

-- Step 3: Drop foreign key constraint on supported_platforms FIRST
-- We need to drop this before we can update the platform_id values
-- Find and drop the existing foreign key constraint
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'user_platforms'::regclass
    AND confrelid = 'supported_platforms'::regclass
    LIMIT 1;
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE user_platforms DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

-- Step 4: Update user_platforms platform_id references
-- Map old supported_platforms.id to new platforms.id by matching platform names
UPDATE user_platforms up
SET platform_id = p.id
FROM supported_platforms sp
JOIN platforms p ON p.name = sp.name
WHERE up.platform_id = sp.id;

-- Step 5: Add foreign key constraint to platforms
-- Drop existing constraint if it exists, then add new one
DO $$
BEGIN
    -- Drop if exists with different name
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'user_platforms'::regclass
        AND conname = 'user_platforms_platform_id_fkey'
    ) THEN
        ALTER TABLE user_platforms DROP CONSTRAINT user_platforms_platform_id_fkey;
    END IF;
END $$;

ALTER TABLE user_platforms
ADD CONSTRAINT user_platforms_platform_id_fkey
FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE;

-- Step 6: Clear existing user_platforms selections
DELETE FROM user_platforms;

-- Step 7: Add default platforms (facebook, yelp, google) for all existing users
INSERT INTO user_platforms (user_id, platform_id)
SELECT p.id, plat.id
FROM profiles p
CROSS JOIN platforms plat
WHERE plat.name IN ('facebook', 'yelp', 'google')
AND plat.is_active = true;

-- Step 8: Drop RLS policies on supported_platforms
DROP POLICY IF EXISTS "Anyone can view active supported platforms" ON supported_platforms;
DROP POLICY IF EXISTS "Admins can view all supported platforms" ON supported_platforms;

-- Step 9: Drop indexes on supported_platforms
DROP INDEX IF EXISTS idx_supported_platforms_name;
DROP INDEX IF EXISTS idx_supported_platforms_is_active;

-- Step 10: Drop supported_platforms table
DROP TABLE IF EXISTS supported_platforms CASCADE;

COMMENT ON TABLE platforms IS 'Review platforms (replaces supported_platforms)';

