-- Check RLS policies on pisco_verifications table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'pisco_verifications' AND schemaname = 'public';

-- Check if RLS is enabled on pisco_verifications
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'pisco_verifications' AND schemaname = 'public';

-- Test if we can actually query the featured verifications
SELECT id, verified_by, pisco_notes, created_at
FROM public.pisco_verifications 
WHERE id IN ('e4a1d3d9-63ed-449a-942a-ef63b149e764', '59e1823a-adee-496d-a529-643a4ffa16de');
