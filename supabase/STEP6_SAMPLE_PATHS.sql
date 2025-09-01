-- ========================================
-- STEP 6: SAMPLE FILE PATHS
-- ========================================

-- Step 6: Show sample file paths for the migration script
SELECT 
  '📂 SAMPLE FILE PATHS' as info,
  regexp_replace(
    photo_url, 
    '.*\/venue-photos\/(.*)', 
    '\1'
  ) as file_path_in_bucket
FROM venues v,
     unnest(v.photos) as photo_url
WHERE v.photos IS NOT NULL 
  AND array_length(v.photos, 1) > 0
  AND photo_url LIKE '%lnoaurqbnmxbsfaahnjw%'
LIMIT 10;

-- Output instructions for next step
SELECT 
  '🚀 NEXT STEPS' as instructions,
  'Copy the file paths from the output above' as step_1,
  'Use them in the Node.js migration script (Step 3)' as step_2,
  'The script will download from dev and upload to prod' as step_3;
