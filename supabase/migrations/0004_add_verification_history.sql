-- Create verification history tracking for community trust
-- This allows multiple users to verify the same venue over time

-- Create pisco_verifications table for tracking all verification attempts
CREATE TABLE IF NOT EXISTS public.pisco_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_by text NOT NULL, -- User's display name
  pisco_status text NOT NULL 
    CHECK (pisco_status IN ('available','unavailable','unverified','temporarily_out')),
  pisco_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS pisco_verifications_venue_id_idx ON public.pisco_verifications (venue_id);
CREATE INDEX IF NOT EXISTS pisco_verifications_user_id_idx ON public.pisco_verifications (user_id);
CREATE INDEX IF NOT EXISTS pisco_verifications_created_at_idx ON public.pisco_verifications (created_at DESC);
CREATE INDEX IF NOT EXISTS pisco_verifications_venue_status_idx ON public.pisco_verifications (venue_id, pisco_status);

-- Enable RLS
ALTER TABLE public.pisco_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read verifications
CREATE POLICY "Public read access for pisco verifications" 
ON public.pisco_verifications FOR SELECT 
USING (true);

-- Only authenticated users can insert their own verifications
CREATE POLICY "Users can insert their own verifications" 
ON public.pisco_verifications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own verifications
CREATE POLICY "Users can update their own verifications" 
ON public.pisco_verifications FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_pisco_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pisco_verifications_updated_at
  BEFORE UPDATE ON public.pisco_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_pisco_verifications_updated_at();

-- Create a view for aggregated verification stats
CREATE OR REPLACE VIEW public.venue_verification_stats AS
SELECT 
  v.id as venue_id,
  -- Latest verification info (for backward compatibility)
  (
    SELECT pv.pisco_status 
    FROM public.pisco_verifications pv 
    WHERE pv.venue_id = v.id 
    ORDER BY pv.created_at DESC 
    LIMIT 1
  ) as latest_pisco_status,
  (
    SELECT pv.verified_by 
    FROM public.pisco_verifications pv 
    WHERE pv.venue_id = v.id 
    ORDER BY pv.created_at DESC 
    LIMIT 1
  ) as latest_verified_by,
  (
    SELECT pv.created_at 
    FROM public.pisco_verifications pv 
    WHERE pv.venue_id = v.id 
    ORDER BY pv.created_at DESC 
    LIMIT 1
  ) as latest_verified_at,
  (
    SELECT pv.pisco_notes 
    FROM public.pisco_verifications pv 
    WHERE pv.venue_id = v.id 
    ORDER BY pv.created_at DESC 
    LIMIT 1
  ) as latest_pisco_notes,
  -- Verification counts
  COALESCE(
    (SELECT COUNT(*) FROM public.pisco_verifications pv WHERE pv.venue_id = v.id AND pv.pisco_status = 'available'), 
    0
  ) as positive_verifications,
  COALESCE(
    (SELECT COUNT(*) FROM public.pisco_verifications pv WHERE pv.venue_id = v.id), 
    0
  ) as total_verifications,
  COALESCE(
    (SELECT COUNT(DISTINCT pv.user_id) FROM public.pisco_verifications pv WHERE pv.venue_id = v.id), 
    0
  ) as unique_verifiers
FROM public.venues v;

-- Grant access to the view
GRANT SELECT ON public.venue_verification_stats TO anon, authenticated;
