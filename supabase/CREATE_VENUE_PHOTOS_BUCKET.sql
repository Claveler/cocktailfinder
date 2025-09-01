-- ========================================
-- CREATE VENUE-PHOTOS STORAGE BUCKET
-- ========================================
-- 
-- This script creates the missing venue-photos bucket and ensures 
-- proper storage policies are in place for the production environment.
--
-- 🔧 HOW TO RUN:
-- 1. Go to: https://supabase.com/dashboard/project/udpygouyogrwvwjbzdul/sql/new
-- 2. Copy and paste this entire script
-- 3. Click "RUN" to execute
--

-- Step 1: Create the venue-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-photos',
  'venue-photos', 
  true,  -- public bucket (allows public read access)
  52428800,  -- 50MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic']  -- only allow image files
)
ON CONFLICT (id) DO NOTHING;  -- Don't error if bucket already exists

-- Step 2: Verify the bucket was created
SELECT 
  id, 
  name, 
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'venue-photos';

-- Step 3: Check if RLS policies exist for storage.objects
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%venue%';

-- Step 4: Create storage policies if they don't exist
-- Note: These might already exist from your migration, but we'll add them with ON CONFLICT handling

-- Public read access
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public read access for venue photos'
  ) THEN
    EXECUTE 'CREATE POLICY "Public read access for venue photos" ON storage.objects FOR SELECT USING (bucket_id = ''venue-photos'')';
  END IF;
END $$;

-- Authenticated upload policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can upload photos to their own folder or admins everywhere'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can upload photos to their own folder or admins everywhere" ON storage.objects FOR INSERT WITH CHECK (
      bucket_id = ''venue-photos'' 
      AND auth.role() = ''authenticated''
      AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = ''admin''
        )
      )
    )';
  END IF;
END $$;

-- Authenticated update policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can update their own photos or admins everywhere'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own photos or admins everywhere" ON storage.objects FOR UPDATE USING (
      bucket_id = ''venue-photos'' 
      AND auth.role() = ''authenticated''
      AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = ''admin''
        )
      )
    )';
  END IF;
END $$;

-- Authenticated delete policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can delete their own photos or admins everywhere'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own photos or admins everywhere" ON storage.objects FOR DELETE USING (
      bucket_id = ''venue-photos'' 
      AND auth.role() = ''authenticated''
      AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = ''admin''
        )
      )
    )';
  END IF;
END $$;

-- Step 5: Final verification - show all venue-photos related policies
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%venue%' OR qual LIKE '%venue-photos%');

-- 🎉 Success message
SELECT 'Venue photos storage bucket and policies have been set up successfully!' as status;
