-- Check RLS policies on venues table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'venues' AND schemaname = 'public';

-- Check if RLS is enabled on venues table (simpler check)
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'venues' AND schemaname = 'public';

-- Test if the venue ID exists and can be found
SELECT id, name, status, created_by
FROM public.venues 
WHERE id = '72271c03-77a6-4e6f-928c-dd016084fe6b';

-- Check current user context
SELECT 
  current_user as database_user,
  session_user as session_user;
