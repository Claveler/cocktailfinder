-- Create venue-photos storage bucket
-- Note: The bucket creation must be done via Supabase Dashboard or Storage API
-- This migration only sets up the policies

-- Storage policies for venue-photos bucket

-- 1. Public read access for all users (anyone can view photos)
CREATE POLICY "Public read access for venue photos" ON storage.objects
FOR SELECT USING (bucket_id = 'venue-photos');

-- 2. Authenticated users can insert photos in their own folder OR if they are admin
CREATE POLICY "Users can upload photos to their own folder or admins everywhere" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'venue-photos' 
  AND auth.role() = 'authenticated'
  AND (
    -- User can upload to their own folder (path starts with their user ID)
    (storage.foldername(name))[1] = auth.uid()::text
    OR 
    -- OR user is admin (check profiles table for role)
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- 3. Authenticated users can update photos in their own folder OR if they are admin
CREATE POLICY "Users can update their own photos or admins everywhere" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'venue-photos' 
  AND auth.role() = 'authenticated'
  AND (
    -- User can update photos in their own folder
    (storage.foldername(name))[1] = auth.uid()::text
    OR 
    -- OR user is admin
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- 4. Authenticated users can delete photos in their own folder OR if they are admin
CREATE POLICY "Users can delete their own photos or admins everywhere" ON storage.objects
FOR DELETE USING (
  bucket_id = 'venue-photos' 
  AND auth.role() = 'authenticated'
  AND (
    -- User can delete photos in their own folder
    (storage.foldername(name))[1] = auth.uid()::text
    OR 
    -- OR user is admin
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Note: RLS is already enabled on storage.objects by default
-- If you need to enable it manually, do it via Supabase Dashboard → Storage → Settings
