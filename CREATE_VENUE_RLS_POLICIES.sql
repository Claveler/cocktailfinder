-- Create RLS policies for venues table to allow proper access

-- Policy for SELECT (reading venues)
CREATE POLICY "Anyone can view approved venues" ON public.venues
  FOR SELECT
  USING (status = 'approved' OR auth.role() = 'service_role');

-- Policy for INSERT (creating venues) 
CREATE POLICY "Authenticated users can create venues" ON public.venues
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policy for UPDATE (editing venues)
CREATE POLICY "Venue creators and service role can update venues" ON public.venues
  FOR UPDATE
  USING (
    created_by = auth.uid() OR 
    auth.role() = 'service_role'
  );

-- Policy for DELETE (removing venues)
CREATE POLICY "Service role can delete venues" ON public.venues
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'venues' AND schemaname = 'public'
ORDER BY cmd, policyname;
