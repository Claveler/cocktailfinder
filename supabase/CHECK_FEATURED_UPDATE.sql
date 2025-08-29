-- Check if the featured verification was actually saved to the database
SELECT 
  id,
  name, 
  featured_verification_id,
  updated_at
FROM public.venues 
WHERE featured_verification_id IS NOT NULL
ORDER BY updated_at DESC;

-- Check if any venues were recently updated
SELECT 
  id,
  name,
  featured_verification_id,
  updated_at
FROM public.venues
ORDER BY updated_at DESC
LIMIT 5;

-- Check RLS policies on venues table that might block UPDATE
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'venues' AND schemaname = 'public' AND cmd = 'UPDATE';
