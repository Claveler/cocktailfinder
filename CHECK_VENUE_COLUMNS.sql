-- Check if latitude and longitude columns exist in venues table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'venues' 
  AND table_schema = 'public'
  AND column_name IN ('latitude', 'longitude', 'location')
ORDER BY column_name;

-- Also check the actual venue data
SELECT id, name, latitude, longitude, 
       CASE 
         WHEN location IS NOT NULL THEN ST_AsText(location::geometry)
         ELSE 'NULL'
       END as location_text
FROM public.venues 
WHERE name = 'Lafuente Lorenzo S.A.'
LIMIT 1;
