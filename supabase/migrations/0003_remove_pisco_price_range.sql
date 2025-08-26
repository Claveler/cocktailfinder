-- Remove redundant pisco_price_range column
-- The venue already has a price_range field that serves this purpose

-- Drop the column and its constraints
alter table public.venues
drop column if exists pisco_price_range;

-- Remove the index that was created for pisco_price_range (if it exists)
drop index if exists venues_pisco_price_range_idx;
