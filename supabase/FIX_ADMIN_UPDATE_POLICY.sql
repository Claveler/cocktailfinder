-- Fix the RLS UPDATE policy to allow admin users

-- First, check current admin user setup
SELECT id, email, raw_app_meta_data, raw_user_meta_data
FROM auth.users 
WHERE email = 'clavel@hotmail.com' OR id = auth.uid()
LIMIT 2;

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Venue creators and service role can update venues" ON public.venues;

-- Create a new policy that includes admin users
CREATE POLICY "Venue creators, service role, and admins can update venues" ON public.venues
  FOR UPDATE
  USING (
    created_by = auth.uid() OR 
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- Verify the new policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'venues' AND schemaname = 'public' AND cmd = 'UPDATE';
