-- ========================================
-- FIX: ADD MISSING UPLOAD POLICY
-- ========================================
-- 
-- This adds the upload policy that might have been missed in Step 1
--
-- 🔧 HOW TO RUN:
-- 1. In the same Supabase SQL Editor tab
-- 2. Copy and paste this script  
-- 3. Click "RUN" to execute
--

-- Add the upload policy
CREATE POLICY "Users can upload photos to their own folder or admins everywhere" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'venue-photos' 
  AND auth.role() = 'authenticated'
  AND (
    -- User can upload to their own folder (path starts with their user ID)
    (storage.foldername(name))[1] = auth.uid()::text
    OR 
    -- OR user is admin (check profiles table for role)
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Verify all policies are now active
SELECT 
  '🔒 ALL POLICIES' as verification,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%venue%' OR qual LIKE '%venue-photos%')
ORDER BY cmd, policyname;
