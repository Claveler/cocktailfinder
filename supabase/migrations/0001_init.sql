-- Enable extensions
create extension if not exists postgis;
create extension if not exists pg_trgm;

-- Profiles (mirror of auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

-- Venues
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('bar','pub','liquor_store')),
  address text not null,
  city text not null,
  country text not null,
  location geography(Point, 4326),
  brands text[] not null default '{}',
  price_range text,
  ambiance text[] not null default '{}',
  photos text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Comments / Reviews
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

-- Suggested edits
create table if not exists public.suggested_edits (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  suggested_json jsonb not null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists venues_city_country_idx on public.venues (city, country);
create index if not exists venues_status_idx on public.venues (status);
create index if not exists venues_name_trgm on public.venues using gin (name gin_trgm_ops);
create index if not exists venues_location_gix on public.venues using gist (location);
