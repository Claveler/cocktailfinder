-- ========================================
-- TEST STORAGE ACCESS AND PERMISSIONS
-- ========================================
-- 
-- This script helps diagnose storage issues and verify the setup
--
-- 🔧 HOW TO RUN:
-- 1. Go to: https://supabase.com/dashboard/project/udpygouyogrwvwjbzdul/sql/new
-- 2. Copy and paste this script
-- 3. Click "RUN" to execute
--

-- Test 1: Check if venue-photos bucket exists
SELECT 
  '🗄️ BUCKET CHECK' as test,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ venue-photos bucket exists'
    ELSE '❌ venue-photos bucket NOT FOUND'
  END as result
FROM storage.buckets 
WHERE id = 'venue-photos';

-- Test 2: Show bucket configuration
SELECT 
  '⚙️ BUCKET CONFIG' as test,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'venue-photos';

-- Test 3: Check RLS policies for storage
SELECT 
  '🔒 RLS POLICIES' as test,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual LIKE '%venue-photos%' THEN '✅ Targets venue-photos'
    ELSE '⚠️ General policy'
  END as bucket_specific
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

-- Test 4: Check current user authentication
SELECT 
  '👤 AUTH STATUS' as test,
  auth.uid() as current_user_id,
  auth.role() as auth_role,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ User authenticated'
    ELSE '❌ User not authenticated'
  END as auth_status;

-- Test 5: Check if current user has admin role
SELECT 
  '👑 ADMIN CHECK' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) THEN '✅ Current user is admin'
    ELSE '❌ Current user is not admin'
  END as admin_status;

-- Test 6: Show all buckets (for comparison)
SELECT 
  '📂 ALL BUCKETS' as test,
  id,
  name,
  public,
  created_at
FROM storage.buckets
ORDER BY created_at;

-- Test 7: Check if RLS is enabled on storage.objects
SELECT 
  '🛡️ RLS STATUS' as test,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- Test 8: Count existing files in venue-photos (if any)
SELECT 
  '📄 EXISTING FILES' as test,
  COUNT(*) as file_count,
  ARRAY_AGG(DISTINCT (storage.foldername(name))[1]) as user_folders
FROM storage.objects 
WHERE bucket_id = 'venue-photos';
