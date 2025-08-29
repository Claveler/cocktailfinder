-- Check current RLS policies on theme_settings table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'theme_settings' AND schemaname = 'public';

-- Check if RLS is enabled on theme_settings
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'theme_settings' AND schemaname = 'public';

-- Test if we can actually query the featured verifications
SELECT id, name, is_active, created_by
FROM public.theme_settings
LIMIT 5;
