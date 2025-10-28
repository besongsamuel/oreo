-- Create company_logo storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company_logo',
  'company_logo',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company_logo bucket

-- Allow authenticated users to upload to their company folder
CREATE POLICY "Users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company_logo' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE owner_id = auth.uid()
  )
);

-- Allow authenticated users to update their company logos
CREATE POLICY "Users can update company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company_logo' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'company_logo' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE owner_id = auth.uid()
  )
);

-- Allow authenticated users to delete their company logos
CREATE POLICY "Users can delete company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company_logo' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE owner_id = auth.uid()
  )
);

-- Allow public to view company logos (for displaying on website)
CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company_logo');

