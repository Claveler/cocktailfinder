-- Check if featured_verification_id column exists and is properly configured
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'venues' 
  AND table_schema = 'public'
  AND column_name = 'featured_verification_id';
