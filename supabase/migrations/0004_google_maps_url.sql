-- Add Google Maps URL column to venues table
-- This stores the original Google Maps link that was used to extract coordinates
-- Allows "Open in Google Maps" to link to the actual venue page instead of just coordinates

ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS google_maps_url text;

-- Add a comment to document the purpose of this column
COMMENT ON COLUMN public.venues.google_maps_url IS 'Original Google Maps URL used for coordinate extraction. When available, this provides a better "Open in Maps" experience with venue details rather than just coordinates.';

-- Create an index for potential filtering/searching by google_maps_url
CREATE INDEX IF NOT EXISTS venues_google_maps_url_idx ON public.venues (google_maps_url) WHERE google_maps_url IS NOT NULL;
