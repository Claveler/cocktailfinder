-- Fix the manually added venue by extracting coordinates from PostGIS location
-- and populating the separate latitude/longitude columns

-- First, let's see what we're working with
SELECT 
  name,
  latitude,
  longitude,
  ST_X(location::geometry) as extracted_longitude,
  ST_Y(location::geometry) as extracted_latitude,
  location
FROM public.venues 
WHERE name = 'Lafuente Lorenzo S.A.';

-- Update the venue with extracted coordinates
UPDATE public.venues 
SET 
  latitude = ST_Y(location::geometry),
  longitude = ST_X(location::geometry)
WHERE name = 'Lafuente Lorenzo S.A.' 
  AND latitude IS NULL 
  AND longitude IS NULL
  AND location IS NOT NULL;

-- Verify the fix
SELECT 
  name,
  latitude,
  longitude,
  city,
  country
FROM public.venues 
WHERE name = 'Lafuente Lorenzo S.A.';

-- Check all venues now have coordinates in the right format
SELECT 
  name,
  CASE 
    WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN '✅ Has lat/lng'
    WHEN location IS NOT NULL THEN '⚠️ Only PostGIS'
    ELSE '❌ No coordinates'
  END as coordinate_status,
  latitude,
  longitude
FROM public.venues
ORDER BY created_at DESC;
