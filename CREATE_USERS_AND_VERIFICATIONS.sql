-- Step 1: Create some fake users in auth.users table
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES
  (gen_random_uuid(), 'maria.gonzalez@example.com', 'fake_hash', NOW(), NOW(), NOW(), '{}', '{"name": "María González"}', false, 'authenticated'),
  (gen_random_uuid(), 'carlos.mendoza@example.com', 'fake_hash', NOW(), NOW(), NOW(), '{}', '{"name": "Carlos Mendoza"}', false, 'authenticated'),
  (gen_random_uuid(), 'sofia.martinez@example.com', 'fake_hash', NOW(), NOW(), NOW(), '{}', '{"name": "Sofía Martínez"}', false, 'authenticated'),
  (gen_random_uuid(), 'james.wilson@example.com', 'fake_hash', NOW(), NOW(), NOW(), '{}', '{"name": "James Wilson"}', false, 'authenticated'),
  (gen_random_uuid(), 'elena.petrova@example.com', 'fake_hash', NOW(), NOW(), NOW(), '{}', '{"name": "Elena Petrova"}', false, 'authenticated');

-- Step 2: Insert verification records using the created users
WITH fake_users AS (
  SELECT id, 
         CASE 
           WHEN email LIKE 'maria%' THEN 'María González'
           WHEN email LIKE 'carlos%' THEN 'Carlos Mendoza'
           WHEN email LIKE 'sofia%' THEN 'Sofía Martínez'
           WHEN email LIKE 'james%' THEN 'James Wilson'
           WHEN email LIKE 'elena%' THEN 'Elena Petrova'
         END as display_name
  FROM auth.users 
  WHERE email LIKE '%@example.com'
),
venue_user_combinations AS (
  SELECT v.id as venue_id, 
         u.id as user_id, 
         u.display_name,
         ROW_NUMBER() OVER (PARTITION BY v.id ORDER BY random()) as rn
  FROM public.venues v
  CROSS JOIN fake_users u
  WHERE random() < 0.7  -- 70% chance for each user-venue combination
)
INSERT INTO public.pisco_verifications (venue_id, user_id, verified_by, pisco_status, pisco_notes, created_at)
SELECT 
  venue_id,
  user_id,
  display_name,
  CASE 
    WHEN random() < 0.8 THEN 'available'
    WHEN random() < 0.9 THEN 'temporarily_out'
    ELSE 'unavailable'
  END as pisco_status,
  CASE 
    WHEN random() < 0.8 THEN 'Confirmed they have good pisco selection'
    WHEN random() < 0.9 THEN 'Out of stock but expecting delivery soon'
    ELSE 'No pisco available at the moment'
  END as pisco_notes,
  NOW() - (random() * INTERVAL '30 days') as created_at
FROM venue_user_combinations
WHERE rn <= 3; -- Maximum 3 verifications per venue

-- Step 3: Show verification stats to confirm it worked
SELECT 
  v.name,
  v.city,
  COUNT(pv.id) as total_verifications,
  COUNT(CASE WHEN pv.pisco_status = 'available' THEN 1 END) as positive_verifications,
  COUNT(DISTINCT pv.user_id) as unique_verifiers,
  CASE 
    WHEN COUNT(pv.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN pv.pisco_status = 'available' THEN 1 END)::decimal / COUNT(pv.id)) * 100, 0)
    ELSE 0 
  END as verification_percentage,
  MAX(pv.created_at) as last_verification
FROM public.venues v
LEFT JOIN public.pisco_verifications pv ON v.id = pv.venue_id
GROUP BY v.id, v.name, v.city
ORDER BY total_verifications DESC, v.name;
