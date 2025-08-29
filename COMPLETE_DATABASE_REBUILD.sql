-- COMPLETE DATABASE REBUILD - ALL MIGRATIONS IN CORRECT ORDER
-- This rebuilds the database with ALL expected tables and columns

-- Enable extensions (from 0001_init.sql)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Profiles table (from 0001_init.sql)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Venues table (from 0001_init.sql)
CREATE TABLE IF NOT EXISTS public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bar','pub','liquor_store')),
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  location geography(Point, 4326),
  brands text[] NOT NULL DEFAULT '{}',
  price_range text,
  ambiance text[] NOT NULL DEFAULT '{}',
  photos text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add pisco fields to venues (from 0002_add_pisco_fields.sql)
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS pisco_status text NOT NULL DEFAULT 'unverified' 
  CHECK (pisco_status IN ('available','unavailable','unverified','temporarily_out')),
ADD COLUMN IF NOT EXISTS last_verified timestamptz,
ADD COLUMN IF NOT EXISTS verified_by text,
ADD COLUMN IF NOT EXISTS pisco_notes text,
ADD COLUMN IF NOT EXISTS pisco_price_range text 
  CHECK (pisco_price_range IN ('budget','moderate','premium'));

-- Add coordinate columns (from 0003_coordinate_columns.sql)
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Add Google Maps URL (from 0004_google_maps_url.sql)
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS google_maps_url text;

-- Comments table (from 0001_init.sql)
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Suggested edits table (from 0001_init.sql)
CREATE TABLE IF NOT EXISTS public.suggested_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  suggested_json jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Pisco verifications table (from 0004_add_verification_history.sql)
CREATE TABLE IF NOT EXISTS public.pisco_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_by text NOT NULL,
  pisco_status text NOT NULL 
    CHECK (pisco_status IN ('available','unavailable','unverified','temporarily_out')),
  pisco_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Theme settings table (from 0005_global_theme_settings.sql)
CREATE TABLE IF NOT EXISTS public.theme_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    colors JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Create all indexes
CREATE INDEX IF NOT EXISTS venues_city_country_idx ON public.venues (city, country);
CREATE INDEX IF NOT EXISTS venues_status_idx ON public.venues (status);
CREATE INDEX IF NOT EXISTS venues_name_trgm ON public.venues USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS venues_location_gix ON public.venues USING gist (location);
CREATE INDEX IF NOT EXISTS venues_pisco_status_idx ON public.venues (pisco_status);
CREATE INDEX IF NOT EXISTS venues_last_verified_idx ON public.venues (last_verified DESC);
CREATE INDEX IF NOT EXISTS venues_latitude_longitude_idx ON public.venues (latitude, longitude);
CREATE INDEX IF NOT EXISTS venues_google_maps_url_idx ON public.venues (google_maps_url) WHERE google_maps_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS pisco_verifications_venue_id_idx ON public.pisco_verifications (venue_id);
CREATE INDEX IF NOT EXISTS pisco_verifications_user_id_idx ON public.pisco_verifications (user_id);
CREATE INDEX IF NOT EXISTS pisco_verifications_created_at_idx ON public.pisco_verifications (created_at DESC);
CREATE INDEX IF NOT EXISTS pisco_verifications_venue_status_idx ON public.pisco_verifications (venue_id, pisco_status);
CREATE INDEX IF NOT EXISTS idx_theme_settings_active ON public.theme_settings (is_active);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggested_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pisco_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
  END IF;
END $$;

-- RLS Policies for venues
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'venues' AND policyname = 'Approved venues are viewable by everyone') THEN
    CREATE POLICY "Approved venues are viewable by everyone" ON public.venues FOR SELECT USING (status = 'approved' OR auth.uid() = created_by);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'venues' AND policyname = 'Authenticated users can insert venues') THEN
    CREATE POLICY "Authenticated users can insert venues" ON public.venues FOR INSERT WITH CHECK (auth.uid() = created_by);
  END IF;
END $$;

-- RLS Policies for comments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Public read access for comments') THEN
    CREATE POLICY "Public read access for comments" ON public.comments FOR SELECT USING (true);
  END IF;
END $$;

-- RLS Policies for pisco_verifications
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pisco_verifications' AND policyname = 'Public read access for pisco verifications') THEN
    CREATE POLICY "Public read access for pisco verifications" ON public.pisco_verifications FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pisco_verifications' AND policyname = 'Users can insert their own verifications') THEN
    CREATE POLICY "Users can insert their own verifications" ON public.pisco_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies for theme settings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'theme_settings' AND policyname = 'Public read active theme') THEN
    CREATE POLICY "Public read active theme" ON public.theme_settings FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- Create functions
CREATE OR REPLACE FUNCTION update_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.location IS NOT NULL THEN
        NEW.latitude = ST_Y(NEW.location::geometry);
        NEW.longitude = ST_X(NEW.location::geometry);
    ELSE
        NEW.latitude = NULL;
        NEW.longitude = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_pisco_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ensure_single_active_theme()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        UPDATE public.theme_settings 
        SET is_active = false 
        WHERE id != NEW.id AND is_active = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS venues_update_coordinates ON public.venues;
CREATE TRIGGER venues_update_coordinates
    BEFORE INSERT OR UPDATE ON public.venues
    FOR EACH ROW
    EXECUTE FUNCTION update_coordinates();

DROP TRIGGER IF EXISTS update_pisco_verifications_updated_at ON public.pisco_verifications;
CREATE TRIGGER update_pisco_verifications_updated_at
  BEFORE UPDATE ON public.pisco_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_pisco_verifications_updated_at();

DROP TRIGGER IF EXISTS trigger_ensure_single_active_theme ON public.theme_settings;
CREATE TRIGGER trigger_ensure_single_active_theme
    BEFORE INSERT OR UPDATE ON public.theme_settings
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_theme();

-- Insert default theme
INSERT INTO public.theme_settings (name, colors, is_active, created_at, updated_at)
VALUES (
    'Default Piscola Theme',
    '{
        "primary": "#d32117",
        "foreground": "#301718",
        "background": "#f4f5f7",
        "card": "#ffffff",
        "textAccent": "#ffffff",
        "secondary": "#f5f2f2",
        "accent": "#d32117",
        "muted": "#faf9f9",
        "border": "#e5dede"
    }'::jsonb,
    true,
    NOW(),
    NOW()
) ON CONFLICT (name) DO UPDATE SET 
    colors = EXCLUDED.colors,
    updated_at = NOW();

-- Show completion status
SELECT 'Database rebuild completed successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
