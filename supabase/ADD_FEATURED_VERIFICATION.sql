-- Add featured_verification_id to venues table
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS featured_verification_id UUID REFERENCES public.pisco_verifications(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_venues_featured_verification_id 
ON public.venues(featured_verification_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'venues' 
  AND table_schema = 'public'
  AND column_name = 'featured_verification_id';
