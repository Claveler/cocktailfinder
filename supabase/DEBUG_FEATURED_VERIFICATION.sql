-- Step 1: Check if the featured_verification_id column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'venues' 
  AND table_schema = 'public'
  AND column_name = 'featured_verification_id';

-- Step 2: Check if any venues have a featured verification set
SELECT id, name, featured_verification_id
FROM public.venues 
WHERE featured_verification_id IS NOT NULL;

-- Step 3: Check what verification data we have
SELECT 
  v.name as venue_name,
  v.featured_verification_id,
  pv.id as verification_id,
  pv.verified_by,
  LEFT(pv.pisco_notes, 50) as notes_preview
FROM public.venues v
LEFT JOIN public.pisco_verifications pv ON v.id = pv.venue_id
WHERE pv.pisco_notes IS NOT NULL
ORDER BY v.name, pv.created_at DESC;
