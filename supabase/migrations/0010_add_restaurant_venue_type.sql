-- Add 'restaurant' to venue type check constraint
-- Drop existing check constraint and recreate with restaurant type

ALTER TABLE public.venues 
DROP CONSTRAINT IF EXISTS venues_type_check;

ALTER TABLE public.venues 
ADD CONSTRAINT venues_type_check 
CHECK (type IN ('bar', 'pub', 'liquor_store', 'restaurant'));
