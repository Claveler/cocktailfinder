-- Add pisco-specific fields to venues table (without redundant price range)
-- Run this in your Supabase Dashboard SQL Editor

-- Add pisco fields to venues table
ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS pisco_status text NOT NULL DEFAULT 'unverified'
  CHECK (pisco_status IN ('available','unavailable','unverified','temporarily_out')),
ADD COLUMN IF NOT EXISTS last_verified timestamptz,
ADD COLUMN IF NOT EXISTS verified_by text,
ADD COLUMN IF NOT EXISTS pisco_notes text;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS venues_pisco_status_idx ON public.venues (pisco_status);
CREATE INDEX IF NOT EXISTS venues_last_verified_idx ON public.venues (last_verified DESC);

-- Update existing venues to have default pisco status
UPDATE public.venues
SET pisco_status = 'unverified'
WHERE pisco_status IS NULL;

-- Verify the schema change
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'venues' 
  AND table_schema = 'public' 
  AND column_name LIKE '%pisco%' OR column_name IN ('last_verified', 'verified_by');
