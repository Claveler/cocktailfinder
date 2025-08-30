-- REBUILD DATABASE QUERY FOR ORIGINAL WORKING SCHEMA
-- Copy this entire query and run it in Supabase Dashboard → SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create venues table (ORIGINAL SCHEMA - NO FEATURED COMMENTS)
CREATE TABLE IF NOT EXISTS public.venues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bar', 'pub', 'liquor_store')),
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  latitude double precision,
  longitude double precision,
  brands text[] DEFAULT ARRAY[]::text[],
  price_range text,
  ambiance text[] DEFAULT ARRAY[]::text[],
  photos text[] DEFAULT ARRAY[]::text[],
  website_url text,
  google_maps_url text,
  phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Pisco verification fields
  pisco_status text NOT NULL DEFAULT 'unverified' CHECK (pisco_status IN ('available','unavailable','unverified','temporarily_out')),
  last_verified timestamptz,
  verified_by text,
  pisco_notes text
);

-- Create comments table (ORIGINAL SCHEMA - NO IS_FEATURED FIELD)
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create pisco_verifications table for tracking verification history
CREATE TABLE IF NOT EXISTS public.pisco_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_by text NOT NULL,
  pisco_status text NOT NULL CHECK (pisco_status IN ('available','unavailable','unverified','temporarily_out')),
  pisco_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create theme_settings table
CREATE TABLE IF NOT EXISTS public.theme_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  primary_color text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS venues_status_idx ON public.venues (status);
CREATE INDEX IF NOT EXISTS venues_city_country_idx ON public.venues (city, country);
CREATE INDEX IF NOT EXISTS venues_latitude_longitude_idx ON public.venues (latitude, longitude);
CREATE INDEX IF NOT EXISTS venues_pisco_status_idx ON public.venues (pisco_status);
CREATE INDEX IF NOT EXISTS venues_last_verified_idx ON public.venues (last_verified DESC);
CREATE INDEX IF NOT EXISTS venues_google_maps_url_idx ON public.venues (google_maps_url);
CREATE INDEX IF NOT EXISTS pisco_verifications_venue_id_idx ON public.pisco_verifications (venue_id);
CREATE INDEX IF NOT EXISTS pisco_verifications_user_id_idx ON public.pisco_verifications (user_id);
CREATE INDEX IF NOT EXISTS pisco_verifications_created_at_idx ON public.pisco_verifications (created_at DESC);
CREATE INDEX IF NOT EXISTS pisco_verifications_venue_status_idx ON public.pisco_verifications (venue_id, pisco_status);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pisco_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for venues
CREATE POLICY "Approved venues are viewable by everyone" 
ON public.venues FOR SELECT USING (status = 'approved' OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can insert venues" 
ON public.venues FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own venues" 
ON public.venues FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for comments
CREATE POLICY "Public read access for comments" 
ON public.comments FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" 
ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.comments FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for pisco_verifications
CREATE POLICY "Public read access for pisco verifications" 
ON public.pisco_verifications FOR SELECT USING (true);

CREATE POLICY "Users can insert their own verifications" 
ON public.pisco_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verifications" 
ON public.pisco_verifications FOR UPDATE USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for theme_settings
CREATE POLICY "Theme settings are viewable by everyone" 
ON public.theme_settings FOR SELECT USING (true);

-- Create trigger for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pisco_verifications_updated_at 
BEFORE UPDATE ON public.pisco_verifications 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default theme
INSERT INTO public.theme_settings (name, primary_color, is_active) 
VALUES ('Default', '#dc2626', true) 
ON CONFLICT (name) DO NOTHING;

-- Create a function to ensure only one theme is active at a time
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

CREATE TRIGGER trigger_ensure_single_active_theme
  BEFORE INSERT OR UPDATE ON public.theme_settings
  FOR EACH ROW EXECUTE FUNCTION ensure_single_active_theme();

-- Coordinate trigger removed - was causing issues
