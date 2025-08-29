-- Simple fix: Allow specific admin user to update venues

-- Check current user setup
SELECT id, email, raw_app_meta_data, raw_user_meta_data
FROM auth.users 
WHERE email LIKE '%clavel%' OR id = auth.uid()
LIMIT 3;

-- Simple fix: Add your specific user ID to the policy
-- (Replace with your actual user ID after running the query above)

-- DROP POLICY IF EXISTS "Venue creators and service role can update venues" ON public.venues;
-- 
-- CREATE POLICY "Venue creators, service role, and admin can update venues" ON public.venues
--   FOR UPDATE
--   USING (
--     created_by = auth.uid() OR 
--     auth.role() = 'service_role' OR
--     auth.uid() = 'd24b3ddc-8a0b-4b97-9936-a1ef84e9adff'::uuid  -- Replace with your user ID
--   );
