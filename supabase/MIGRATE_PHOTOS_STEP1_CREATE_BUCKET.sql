-- ========================================
-- STEP 1: CREATE VENUE-PHOTOS BUCKET IN PRODUCTION
-- ========================================
-- 
-- This creates the missing venue-photos bucket in piscola-prod
-- and sets up all the necessary RLS policies.
--
-- 🔧 HOW TO RUN:
-- 1. Go to: https://supabase.com/dashboard/project/udpygouyogrwvwjbzdul/sql/new
-- 2. Copy and paste this entire script
-- 3. Click "RUN" to execute
-- 4. Verify success before proceeding to Step 2
--

-- Step 1: Create the venue-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-photos',
  'venue-photos', 
  true,  -- public bucket (allows public read access)
  52428800,  -- 50MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/jpg']  -- allow common image formats
)
ON CONFLICT (id) DO NOTHING;  -- Don't error if bucket already exists

-- Step 2: Verify the bucket was created
SELECT 
  '🗄️ BUCKET CREATED' as status,
  id, 
  name, 
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'venue-photos';

-- Step 3: Create storage policies if they don't exist
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
    RAISE NOTICE '✅ Created public read policy';
  ELSE
    RAISE NOTICE '✅ Public read policy already exists';
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
    RAISE NOTICE '✅ Created upload policy';
  ELSE
    RAISE NOTICE '✅ Upload policy already exists';
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
    RAISE NOTICE '✅ Created update policy';
  ELSE
    RAISE NOTICE '✅ Update policy already exists';
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
    RAISE NOTICE '✅ Created delete policy';
  ELSE
    RAISE NOTICE '✅ Delete policy already exists';
  END IF;
END $$;

-- Step 4: Final verification
SELECT 
  '🎉 SETUP COMPLETE' as status,
  'Bucket and policies created successfully!' as message,
  'Ready for Step 2: Photo Migration' as next_step;

-- Show all policies for verification
SELECT 
  '🔒 ACTIVE POLICIES' as status,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%venue%' OR qual LIKE '%venue-photos%')
ORDER BY policyname;
