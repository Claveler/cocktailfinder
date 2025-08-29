-- Check existing UPDATE policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'venues' AND schemaname = 'public' AND cmd = 'UPDATE';

-- If the policy is too restrictive, we might need to update it
-- This query will show us what the current policy looks like

-- Potential fix (run this if needed):
-- DROP POLICY IF EXISTS "Venue creators and service role can update venues" ON public.venues;
-- 
-- CREATE POLICY "Admins and venue creators can update venues" ON public.venues
--   FOR UPDATE
--   USING (
--     created_by = auth.uid() OR 
--     auth.role() = 'service_role' OR
--     EXISTS (
--       SELECT 1 FROM auth.users 
--       WHERE auth.users.id = auth.uid() 
--       AND (auth.users.raw_app_meta_data->>'role' = 'admin')
--     )
--   );
