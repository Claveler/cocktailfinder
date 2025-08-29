-- SAFE DATABASE REBUILD - CHECK WHAT EXISTS FIRST
-- Run this to see what's currently in your database

-- Check what tables exist
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if venues table exists and what columns it has
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'venues' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if other tables exist
SELECT 
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') as profiles_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'comments' AND table_schema = 'public') as comments_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'pisco_verifications' AND table_schema = 'public') as verifications_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'theme_settings' AND table_schema = 'public') as theme_exists;
