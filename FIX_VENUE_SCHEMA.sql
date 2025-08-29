-- FIX VENUE TABLE SCHEMA TO MATCH REVERTED APP CODE
-- Add missing latitude/longitude columns and remove featured_comment_id

-- Add the missing latitude and longitude columns
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Remove the featured_comment_id column (reverted feature)
ALTER TABLE public.venues 
DROP COLUMN IF EXISTS featured_comment_id;

-- Remove pisco_price_range if it's not needed (check your app code first)
-- ALTER TABLE public.venues DROP COLUMN IF EXISTS pisco_price_range;

-- Add missing columns that might be expected
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS google_maps_url text,
ADD COLUMN IF NOT EXISTS phone text;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS venues_latitude_longitude_idx ON public.venues (latitude, longitude);
CREATE INDEX IF NOT EXISTS venues_google_maps_url_idx ON public.venues (google_maps_url);

-- You can optionally populate latitude/longitude from the location column if needed:
-- UPDATE public.venues 
-- SET latitude = ST_Y(location), longitude = ST_X(location) 
-- WHERE location IS NOT NULL AND (latitude IS NULL OR longitude IS NULL);
