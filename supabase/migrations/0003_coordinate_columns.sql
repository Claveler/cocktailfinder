-- Add coordinate columns for simplified querying
-- This eliminates the need for PostGIS functions in application queries

-- Add coordinate columns to venues table
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Create function to auto-populate coordinates from PostGIS location
CREATE OR REPLACE FUNCTION update_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    -- If location is provided, extract coordinates
    IF NEW.location IS NOT NULL THEN
        NEW.latitude = ST_Y(NEW.location::geometry);
        NEW.longitude = ST_X(NEW.location::geometry);
    ELSE
        -- If location is NULL, set coordinates to NULL
        NEW.latitude = NULL;
        NEW.longitude = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update coordinates on INSERT/UPDATE
DROP TRIGGER IF EXISTS venues_update_coordinates ON public.venues;
CREATE TRIGGER venues_update_coordinates
    BEFORE INSERT OR UPDATE ON public.venues
    FOR EACH ROW
    EXECUTE FUNCTION update_coordinates();

-- Populate coordinates for existing venues
UPDATE public.venues 
SET latitude = ST_Y(location::geometry), 
    longitude = ST_X(location::geometry) 
WHERE location IS NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS venues_latitude_longitude_idx ON public.venues (latitude, longitude);

-- Verify the update worked (this will show in migration output)
DO $$
DECLARE
    venue_count integer;
    coord_count integer;
BEGIN
    SELECT COUNT(*) INTO venue_count FROM public.venues WHERE location IS NOT NULL;
    SELECT COUNT(*) INTO coord_count FROM public.venues WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    
    RAISE NOTICE 'Venues with location: %, Venues with coordinates: %', venue_count, coord_count;
END $$;
