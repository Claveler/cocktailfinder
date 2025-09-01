-- ========================================
-- STEP 4: UPDATE PHOTO URLS IN DATABASE
-- ========================================
-- 
-- This script updates all venue photo URLs to point to the production
-- storage instead of the development storage.
--
-- ⚠️  IMPORTANT: Only run this AFTER successfully migrating photos in Step 3!
--
-- 🔧 HOW TO RUN:
-- 1. Ensure Step 3 (photo migration) completed successfully
-- 2. Go to: https://supabase.com/dashboard/project/udpygouyogrwvwjbzdul/sql/new
-- 3. Copy and paste this script
-- 4. Click "RUN" to execute
--

-- Step 1: Preview what will be changed (DRY RUN)
SELECT 
  '🔍 DRY RUN - PREVIEW OF CHANGES' as preview,
  v.id as venue_id,
  v.name as venue_name,
  v.photos as old_photos_array,
  -- Show what the new array will look like
  ARRAY(
    SELECT replace(
      photo_url, 
      'https://lnoaurqbnmxbsfaahnjw.supabase.co/storage/v1/object/public/venue-photos/',
      'https://udpygouyogrwvwjbzdul.supabase.co/storage/v1/object/public/venue-photos/'
    )
    FROM unnest(v.photos) as photo_url
  ) as new_photos_array
FROM venues v
WHERE v.photos IS NOT NULL 
  AND array_length(v.photos, 1) > 0
  AND EXISTS (
    SELECT 1 
    FROM unnest(v.photos) as photo_url 
    WHERE photo_url LIKE '%lnoaurqbnmxbsfaahnjw%'
  )
ORDER BY v.name;

-- Step 2: Count how many venues will be affected
SELECT 
  '📊 IMPACT ANALYSIS' as analysis,
  COUNT(*) as venues_to_update,
  SUM(array_length(photos, 1)) as total_photos_to_update
FROM venues 
WHERE photos IS NOT NULL 
  AND array_length(photos, 1) > 0
  AND EXISTS (
    SELECT 1 
    FROM unnest(photos) as photo_url 
    WHERE photo_url LIKE '%lnoaurqbnmxbsfaahnjw%'
  );

-- Step 3: Backup current state (optional but recommended)
-- Create a backup table with current URLs
CREATE TABLE IF NOT EXISTS venues_photo_backup AS 
SELECT 
  id,
  name,
  photos,
  now() as backup_timestamp
FROM venues 
WHERE photos IS NOT NULL 
  AND array_length(photos, 1) > 0
  AND EXISTS (
    SELECT 1 
    FROM unnest(photos) as photo_url 
    WHERE photo_url LIKE '%lnoaurqbnmxbsfaahnjw%'
  );

SELECT 
  '💾 BACKUP CREATED' as backup_status,
  COUNT(*) as venues_backed_up
FROM venues_photo_backup;

-- Step 4: Confirm before proceeding
-- Uncomment the next section ONLY after reviewing the preview above
-- and confirming that Step 3 (photo migration) completed successfully

/*
-- ========================================
-- 🚨 ACTUAL UPDATE - UNCOMMENT TO EXECUTE
-- ========================================

-- FINAL CONFIRMATION: Update all photo URLs
UPDATE venues 
SET 
  photos = ARRAY(
    SELECT replace(
      photo_url, 
      'https://lnoaurqbnmxbsfaahnjw.supabase.co/storage/v1/object/public/venue-photos/',
      'https://udpygouyogrwvwjbzdul.supabase.co/storage/v1/object/public/venue-photos/'
    )
    FROM unnest(photos) as photo_url
  ),
  updated_at = now()
WHERE photos IS NOT NULL 
  AND array_length(photos, 1) > 0
  AND EXISTS (
    SELECT 1 
    FROM unnest(photos) as photo_url 
    WHERE photo_url LIKE '%lnoaurqbnmxbsfaahnjw%'
  );
*/

-- Step 5: Verification query (run after the update)
SELECT 
  '✅ VERIFICATION - POST UPDATE' as verification,
  COUNT(CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM unnest(photos) as photo_url 
      WHERE photo_url LIKE '%lnoaurqbnmxbsfaahnjw%'
    ) THEN 1 
  END) as venues_still_with_dev_urls,
  COUNT(CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM unnest(photos) as photo_url 
      WHERE photo_url LIKE '%udpygouyogrwvwjbzdul%'
    ) THEN 1 
  END) as venues_with_prod_urls,
  COUNT(*) as total_venues_with_photos
FROM venues 
WHERE photos IS NOT NULL 
  AND array_length(photos, 1) > 0;

-- Step 6: Show sample updated URLs
SELECT 
  '🔗 SAMPLE UPDATED URLS' as sample,
  v.name as venue_name,
  unnest(v.photos) as photo_url
FROM venues v
WHERE v.photos IS NOT NULL 
  AND array_length(v.photos, 1) > 0
  AND EXISTS (
    SELECT 1 
    FROM unnest(v.photos) as photo_url 
    WHERE photo_url LIKE '%udpygouyogrwvwjbzdul%'
  )
LIMIT 5;

-- Instructions for final step
SELECT 
  '🏁 FINAL STEPS' as instructions,
  'Test photo uploads on your website' as step_1,
  'Verify existing photos still display correctly' as step_2,
  'Migration complete!' as step_3;

-- Cleanup backup table (optional - run after confirming everything works)
-- DROP TABLE venues_photo_backup;
