-- CREATE ONLY MISSING TABLES - NO DROPS
-- Run this after checking what exists with SAFE_REBUILD.sql

-- Enable extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create profiles table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create venues table (only if it doesn't exist)
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
  pisco_status text NOT NULL DEFAULT 'unverified' CHECK (pisco_status IN ('available','unavailable','unverified','temporarily_out')),
  last_verified timestamptz,
  verified_by text,
  pisco_notes text
);

-- Create comments table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create pisco_verifications table (only if it doesn't exist)
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

-- Create theme_settings table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.theme_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  primary_color text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes (safe to run multiple times)
CREATE INDEX IF NOT EXISTS venues_status_idx ON public.venues (status);
CREATE INDEX IF NOT EXISTS venues_city_country_idx ON public.venues (city, country);
CREATE INDEX IF NOT EXISTS venues_pisco_status_idx ON public.venues (pisco_status);
CREATE INDEX IF NOT EXISTS venues_latitude_longitude_idx ON public.venues (latitude, longitude);
CREATE INDEX IF NOT EXISTS pisco_verifications_venue_id_idx ON public.pisco_verifications (venue_id);

-- Enable RLS (safe to run multiple times)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pisco_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (using DO blocks to avoid errors if they already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'venues' AND policyname = 'Users can update their own venues') THEN
    CREATE POLICY "Users can update their own venues" ON public.venues FOR UPDATE USING (auth.uid() = created_by);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Public read access for comments') THEN
    CREATE POLICY "Public read access for comments" ON public.comments FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can insert their own comments') THEN
    CREATE POLICY "Users can insert their own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can update their own comments') THEN
    CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'theme_settings' AND policyname = 'Theme settings are viewable by everyone') THEN
    CREATE POLICY "Theme settings are viewable by everyone" ON public.theme_settings FOR SELECT USING (true);
  END IF;
END $$;

-- Insert default theme (safe - uses ON CONFLICT)
INSERT INTO public.theme_settings (name, primary_color, is_active) 
VALUES ('Default', '#dc2626', true) 
ON CONFLICT (name) DO NOTHING;
