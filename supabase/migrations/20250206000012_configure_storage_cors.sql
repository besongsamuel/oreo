-- Configure platform_company_logos bucket for public access
-- Note: CORS configuration must be done via Supabase Dashboard:
-- Storage → Settings → CORS Configuration
-- Add your frontend domain to allowed origins (e.g., http://localhost:3000 for dev, https://your-domain.com for prod)

-- Ensure the bucket exists and is public
UPDATE storage.buckets
SET public = true
WHERE id = 'platform_company_logos';

-- RLS policies are already set up in 20250206000011_create_platform_logo_bucket.sql
-- which allows public (anon) and authenticated read access
-- This migration just ensures the bucket is marked as public

