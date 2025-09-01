-- ========================================
-- STEP 5 FIXED: MIGRATION SUMMARY  
-- ========================================
-- 
-- Fixed version of Step 5 that works around PostgreSQL limitations
--

-- Step 5: Summary for migration planning (FIXED VERSION)
WITH photo_paths AS (
  SELECT 
    v.id as venue_id,
    regexp_replace(
      photo_url, 
      '.*\/venue-photos\/(.*)', 
      '\1'
    ) as file_path
  FROM venues v,
       unnest(v.photos) as photo_url
  WHERE v.photos IS NOT NULL 
    AND array_length(v.photos, 1) > 0
    AND photo_url LIKE '%lnoaurqbnmxbsfaahnjw%'
)
SELECT 
  '📈 MIGRATION SUMMARY' as summary,
  COUNT(DISTINCT venue_id) as venues_to_update,
  COUNT(*) as total_photos_to_migrate,
  COUNT(DISTINCT file_path) as unique_file_paths
FROM photo_paths;
