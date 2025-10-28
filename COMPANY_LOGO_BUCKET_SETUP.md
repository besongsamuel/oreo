# Company Logo Bucket Setup

## Overview

The `company_logo` bucket allows authenticated users to upload logos for their companies. This document explains how to set it up in production.

## Migration File

The migration file `supabase/migrations/20250128000001_create_company_logo_bucket.sql` has been created and applied locally.

## Applying to Production

### Option 1: Via Supabase CLI (Recommended if you have CLI access)

```bash
# Link to your production project
supabase link --project-ref your-project-ref

# Push the migration
supabase db push
```

### Option 2: Via Supabase Dashboard

1. **Create the Bucket**

   - Go to **Storage** → **Buckets**
   - Click **New bucket**
   - Configure:
     - **Name**: `company_logo`
     - **Public bucket**: ✓ Enabled
     - **File size limit**: `5242880` (5MB in bytes)
     - **Allowed MIME types**: `image/png, image/jpeg, image/jpg, image/gif, image/webp`

2. **Create RLS Policies**
   - Go to **Storage** → **Policies** for the `company_logo` bucket
   - Click **New policy**
   - Create each policy using the SQL editor

#### Policy 1: Users can upload company logos

```sql
CREATE POLICY "Users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company_logo' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE owner_id = auth.uid()
  )
);
```

#### Policy 2: Users can update company logos

```sql
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
```

#### Policy 3: Users can delete company logos

```sql
CREATE POLICY "Users can delete company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company_logo' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE owner_id = auth.uid()
  )
);
```

#### Policy 4: Anyone can view company logos

```sql
CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company_logo');
```

## How It Works

- **File Upload Path**: `${companyId}/logo.{extension}`
- **Example**: `123e4567-e89b-12d3-a456-426614174000/logo.png`

The policies ensure:

- ✅ Users can only upload to folders matching their company IDs
- ✅ File type validation (images only)
- ✅ File size limit (5MB)
- ✅ Public read access for displaying logos on the website

## Security

The RLS policies use `storage.foldername(name)` to extract the first folder name from the file path and verify it matches one of the user's company IDs. This ensures:

- Users can only manage logos for companies they own
- Public read access for all logos (for display purposes)
- Proper file type and size restrictions
