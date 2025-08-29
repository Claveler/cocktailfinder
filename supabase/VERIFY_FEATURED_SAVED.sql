-- Verify that featured verification is actually saved and fetch the full data
SELECT 
  v.id,
  v.name,
  v.featured_verification_id,
  pv.verified_by as featured_verified_by,
  pv.pisco_notes as featured_notes,
  pv.created_at as featured_created_at
FROM public.venues v
LEFT JOIN public.pisco_verifications pv ON v.featured_verification_id = pv.id
WHERE v.featured_verification_id IS NOT NULL
ORDER BY v.updated_at DESC;
