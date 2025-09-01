-- ========================================
-- TEMPORARILY RELAX MIME TYPE RESTRICTIONS
-- ========================================
-- 
-- This allows the migration to work, then we'll restore restrictions
--

-- Step 1: Remove MIME type restrictions temporarily for migration
UPDATE storage.buckets 
SET allowed_mime_types = NULL 
WHERE id = 'venue-photos';

-- Step 2: Verify the change
SELECT 
  '🔓 MIME RESTRICTIONS REMOVED' as status,
  id,
  name,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'venue-photos';

-- After migration is complete, run this to restore restrictions:
-- UPDATE storage.buckets 
-- SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/jpg']
-- WHERE id = 'venue-photos';
