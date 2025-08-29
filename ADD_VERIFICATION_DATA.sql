-- Add verification records to pisco_verifications table
-- This will make the verification stats show up in venue cards

-- Insert verification records for each venue
INSERT INTO public.pisco_verifications (venue_id, user_id, verified_by, pisco_status, pisco_notes, created_at)
SELECT 
  v.id,
  gen_random_uuid(), -- Generate random user ID (since we don't have real auth users)
  v.verified_by,
  v.pisco_status,
  v.pisco_notes,
  v.last_verified
FROM public.venues v
WHERE v.pisco_status != 'unverified' AND v.verified_by IS NOT NULL;

-- Add some additional verification records to create more realistic stats
-- (multiple people verifying the same venue)

-- Bar Constitución - add 2 more verifications
INSERT INTO public.pisco_verifications (venue_id, user_id, verified_by, pisco_status, pisco_notes, created_at)
SELECT 
  v.id,
  gen_random_uuid(),
  'Carlos Rodriguez',
  'available',
  'Confirmed - they have Capel in stock',
  TIMESTAMP WITH TIME ZONE '2024-01-14 17:00:00+00'
FROM public.venues v
WHERE v.name = 'Bar Constitución';

INSERT INTO public.pisco_verifications (venue_id, user_id, verified_by, pisco_status, pisco_notes, created_at)
SELECT 
  v.id,
  gen_random_uuid(),
  'Elena Silva',
  'available',
  'Great pisco selection, friendly staff',
  TIMESTAMP WITH TIME ZONE '2024-01-16 19:30:00+00'
FROM public.venues v
WHERE v.name = 'Bar Constitución';

-- Pisco Bar Madrid - add 1 more verification
INSERT INTO public.pisco_verifications (venue_id, user_id, verified_by, pisco_status, pisco_notes, created_at)
SELECT 
  v.id,
  gen_random_uuid(),
  'Miguel Torres',
  'available',
  'Excellent pisco cocktails',
  TIMESTAMP WITH TIME ZONE '2024-01-13 21:15:00+00'
FROM public.venues v
WHERE v.name = 'Pisco Bar Madrid';

-- Chilean Corner - add a negative verification (different user saying it's out)
INSERT INTO public.pisco_verifications (venue_id, user_id, verified_by, pisco_status, pisco_notes, created_at)
SELECT 
  v.id,
  gen_random_uuid(),
  'David Brown',
  'temporarily_out',
  'Confirmed - out of stock until next delivery',
  TIMESTAMP WITH TIME ZONE '2024-01-06 18:00:00+00'
FROM public.venues v
WHERE v.name = 'Chilean Corner';

-- Show verification stats after insertion
SELECT 
  v.name,
  COUNT(pv.id) as total_verifications,
  COUNT(CASE WHEN pv.pisco_status = 'available' THEN 1 END) as positive_verifications,
  COUNT(DISTINCT pv.user_id) as unique_verifiers,
  ROUND(
    (COUNT(CASE WHEN pv.pisco_status = 'available' THEN 1 END)::decimal / COUNT(pv.id)) * 100, 
    0
  ) as verification_percentage
FROM public.venues v
LEFT JOIN public.pisco_verifications pv ON v.id = pv.venue_id
GROUP BY v.id, v.name
ORDER BY v.name;
