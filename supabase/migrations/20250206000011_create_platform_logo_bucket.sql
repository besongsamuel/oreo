-- Create platform_company_logos storage bucket
-- This bucket stores platform logos scraped from Zembra website

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'platform_company_logos',
  'platform_company_logos',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for platform_company_logos bucket

-- Allow service role to upload/update platform logos (for migration scripts)
CREATE POLICY "Service role can manage platform logos"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'platform_company_logos')
WITH CHECK (bucket_id = 'platform_company_logos');

-- Allow unauthenticated and authenticated users to view platform logos
-- This enables public read access for displaying logos on the website
DROP POLICY IF EXISTS "Anyone can view platform logos" ON storage.objects;
CREATE POLICY "Anyone can view platform logos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'platform_company_logos');

