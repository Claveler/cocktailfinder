-- ========================================
-- STEP 2: ANALYZE EXISTING PHOTO URLS
-- ========================================
-- 
-- This script analyzes your current venue photos to understand
-- what needs to be migrated from Piscola2 to piscola-prod.
--
-- 🔧 HOW TO RUN:
-- 1. Go to: https://supabase.com/dashboard/project/udpygouyogrwvwjbzdul/sql/new
-- 2. Copy and paste this script
-- 3. Click "RUN" to execute
-- 4. Review the output to understand the migration scope
--

-- Step 1: Show venues with photos
SELECT 
  '📊 VENUES WITH PHOTOS' as analysis,
  COUNT(*) as total_venues_with_photos,
  SUM(array_length(photos, 1)) as total_photo_count
FROM venues 
WHERE photos IS NOT NULL 
  AND array_length(photos, 1) > 0;

-- Step 2: Analyze photo URLs by project
SELECT 
  '🔍 PHOTO URL ANALYSIS' as analysis,
  CASE 
    WHEN photo_url LIKE '%lnoaurqbnmxbsfaahnjw%' THEN 'Piscola2 (dev) - NEEDS MIGRATION'
    WHEN photo_url LIKE '%udpygouyogrwvwjbzdul%' THEN 'piscola-prod (prod) - OK'
    ELSE 'Other/Unknown'
  END as project_source,
  COUNT(*) as photo_count
FROM (
  SELECT unnest(photos) as photo_url
  FROM venues 
  WHERE photos IS NOT NULL 
    AND array_length(photos, 1) > 0
) photo_analysis
GROUP BY 
  CASE 
    WHEN photo_url LIKE '%lnoaurqbnmxbsfaahnjw%' THEN 'Piscola2 (dev) - NEEDS MIGRATION'
    WHEN photo_url LIKE '%udpygouyogrwvwjbzdul%' THEN 'piscola-prod (prod) - OK'
    ELSE 'Other/Unknown'
  END
ORDER BY photo_count DESC;

-- Step 3: Show detailed breakdown of URLs that need migration
SELECT 
  '📋 MIGRATION LIST' as analysis,
  v.id as venue_id,
  v.name as venue_name,
  v.city,
  unnest(v.photos) as old_url,
  -- Extract the path part after /venue-photos/
  regexp_replace(
    unnest(v.photos), 
    '.*\/venue-photos\/(.*)', 
    '\1'
  ) as file_path
FROM venues v
WHERE v.photos IS NOT NULL 
  AND array_length(v.photos, 1) > 0
  AND EXISTS (
    SELECT 1 
    FROM unnest(v.photos) as photo_url 
    WHERE photo_url LIKE '%lnoaurqbnmxbsfaahnjw%'
  )
ORDER BY v.name;

-- Step 4: Generate the new URLs that will replace the old ones
SELECT 
  '🔄 URL MAPPING' as analysis,
  v.id as venue_id,
  v.name as venue_name,
  unnest(v.photos) as old_url,
  -- Generate the new production URL
  'https://udpygouyogrwvwjbzdul.supabase.co/storage/v1/object/public/venue-photos/' || 
  regexp_replace(
    unnest(v.photos), 
    '.*\/venue-photos\/(.*)', 
    '\1'
  ) as new_url
FROM venues v
WHERE v.photos IS NOT NULL 
  AND array_length(v.photos, 1) > 0
  AND EXISTS (
    SELECT 1 
    FROM unnest(v.photos) as photo_url 
    WHERE photo_url LIKE '%lnoaurqbnmxbsfaahnjw%'
  )
ORDER BY v.name;

-- Step 5: Summary for migration planning
SELECT 
  '📈 MIGRATION SUMMARY' as summary,
  COUNT(DISTINCT v.id) as venues_to_update,
  COUNT(*) as total_photos_to_migrate,
  COUNT(DISTINCT regexp_replace(unnest(v.photos), '.*\/venue-photos\/(.*)', '\1')) as unique_file_paths
FROM venues v
WHERE v.photos IS NOT NULL 
  AND array_length(v.photos, 1) > 0
  AND EXISTS (
    SELECT 1 
    FROM unnest(v.photos) as photo_url 
    WHERE photo_url LIKE '%lnoaurqbnmxbsfaahnjw%'
  );

-- Step 6: Show sample file paths for the migration script
SELECT 
  '📂 SAMPLE FILE PATHS' as info,
  regexp_replace(
    unnest(photos), 
    '.*\/venue-photos\/(.*)', 
    '\1'
  ) as file_path_in_bucket
FROM venues 
WHERE photos IS NOT NULL 
  AND array_length(photos, 1) > 0
  AND EXISTS (
    SELECT 1 
    FROM unnest(photos) as photo_url 
    WHERE photo_url LIKE '%lnoaurqbnmxbsfaahnjw%'
  )
LIMIT 10;

-- Output instructions for next step
SELECT 
  '🚀 NEXT STEPS' as instructions,
  'Copy the file paths from the output above' as step_1,
  'Use them in the Node.js migration script (Step 3)' as step_2,
  'The script will download from dev and upload to prod' as step_3;
