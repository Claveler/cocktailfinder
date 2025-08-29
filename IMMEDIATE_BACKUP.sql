-- IMMEDIATE BACKUP - Run this in Supabase SQL Editor
-- Copy the output and save as backup_working_database.sql

-- Show current data counts first
SELECT 'Current Database Status:' as status;
SELECT 'Venues: ' || COUNT(*) as count FROM public.venues;
SELECT 'Comments: ' || COUNT(*) as count FROM public.comments;  
SELECT 'Verifications: ' || COUNT(*) as count FROM public.pisco_verifications;
SELECT 'Test Users: ' || COUNT(*) as count FROM auth.users WHERE email LIKE '%@example.com';

-- Generate INSERT statements for venues
SELECT '-- VENUES BACKUP' as backup_section
UNION ALL
SELECT 'INSERT INTO public.venues (id, name, type, address, city, country, brands, price_range, ambiance, photos, status, created_by, created_at, updated_at, pisco_status, last_verified, verified_by, pisco_notes, pisco_price_range) VALUES'
UNION ALL
SELECT format('(%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L),',
  id, name, type, address, city, country, brands, price_range, ambiance, photos, status, 
  created_by, created_at, updated_at, pisco_status, last_verified, 
  verified_by, pisco_notes, pisco_price_range
) FROM public.venues
UNION ALL
SELECT '';

-- Generate INSERT statements for pisco_verifications  
SELECT '-- VERIFICATIONS BACKUP' as backup_section
UNION ALL
SELECT 'INSERT INTO public.pisco_verifications (id, venue_id, user_id, verified_by, pisco_status, pisco_notes, created_at) VALUES'
UNION ALL
SELECT format('(%L, %L, %L, %L, %L, %L, %L),',
  id, venue_id, user_id, verified_by, pisco_status, pisco_notes, created_at
) FROM public.pisco_verifications
UNION ALL
SELECT '';

-- Generate INSERT statements for test users
SELECT '-- TEST USERS BACKUP' as backup_section  
UNION ALL
SELECT 'INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role) VALUES'
UNION ALL
SELECT format('(%L, %L, %L, %L, %L, %L, %L, %L, %L, %L),',
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at, 
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role
) FROM auth.users WHERE email LIKE '%@example.com'
UNION ALL
SELECT '';

SELECT '-- END BACKUP' as backup_section;
