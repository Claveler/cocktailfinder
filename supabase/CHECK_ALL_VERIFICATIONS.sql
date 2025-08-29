-- Check all pisco verification records we have
SELECT 
  pv.venue_id,
  v.name as venue_name,
  pv.verified_by,
  pv.pisco_status,
  pv.pisco_notes,
  pv.created_at
FROM public.pisco_verifications pv
JOIN public.venues v ON pv.venue_id = v.id
ORDER BY v.name, pv.created_at DESC;

-- Check how many verifications each venue has
SELECT 
  v.name,
  COUNT(pv.id) as verification_count,
  string_agg(pv.verified_by, ', ' ORDER BY pv.created_at DESC) as verifiers,
  string_agg(LEFT(pv.pisco_notes, 50), ' | ' ORDER BY pv.created_at DESC) as notes_preview
FROM public.venues v
LEFT JOIN public.pisco_verifications pv ON v.id = pv.venue_id
GROUP BY v.id, v.name
ORDER BY verification_count DESC;
