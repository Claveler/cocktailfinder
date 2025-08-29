-- Check the pisco_verifications table schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'pisco_verifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if we have any verification records
SELECT COUNT(*) as total_verifications FROM public.pisco_verifications;

-- Check example records to see the structure
SELECT 
  venue_id,
  user_id,
  verified_by,
  pisco_status,
  pisco_notes,
  created_at
FROM public.pisco_verifications 
LIMIT 5;

-- Check how many verifications per venue we have
SELECT 
  v.name,
  COUNT(pv.id) as verification_count,
  array_agg(pv.pisco_status ORDER BY pv.created_at DESC) as status_history
FROM public.venues v
LEFT JOIN public.pisco_verifications pv ON v.id = pv.venue_id
GROUP BY v.id, v.name
ORDER BY verification_count DESC;
