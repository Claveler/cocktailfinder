-- Add pisco-specific fields to venues table
alter table public.venues 
add column if not exists pisco_status text not null default 'unverified' 
  check (pisco_status in ('available','unavailable','unverified','temporarily_out')),
add column if not exists last_verified timestamptz,
add column if not exists verified_by text,
add column if not exists pisco_notes text,
add column if not exists pisco_price_range text 
  check (pisco_price_range in ('budget','moderate','premium'));

-- Add index for pisco status filtering
create index if not exists venues_pisco_status_idx on public.venues (pisco_status);

-- Add index for last verified for sorting by freshness
create index if not exists venues_last_verified_idx on public.venues (last_verified desc);

-- Update existing venues to have default pisco status
-- We'll keep them as 'unverified' since we don't know their pisco status yet
update public.venues 
set pisco_status = 'unverified' 
where pisco_status is null;
