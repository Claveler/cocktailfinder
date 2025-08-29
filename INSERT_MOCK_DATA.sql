-- MOCK DATA FOR TESTING
-- Insert realistic test data to verify app functionality

-- First, create some test users in profiles (optional, for reference)
-- Note: These won't work for auth unless you actually create auth users
-- But they're useful for created_by references

INSERT INTO public.venues (
  name, type, address, city, country, latitude, longitude,
  brands, price_range, ambiance, photos, status, 
  pisco_status, last_verified, verified_by, pisco_notes,
  website_url, google_maps_url, phone
) VALUES 

-- Santiago, Chile venues
(
  'Bar Constitución', 'bar', 'Constitución 172', 'Santiago', 'Chile',
  -33.4372, -70.6506,
  ARRAY['Pisco Capel', 'Pisco Control C'],
  'moderate',
  ARRAY['cozy', 'historic', 'intimate'],
  ARRAY['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=2'],
  'approved',
  'available',
  '2024-01-15 18:30:00+00'::timestamptz,
  'María González',
  'Great selection of premium piscos. Capel and Control C available. Excellent piscolas!',
  'https://barcons.cl',
  'https://maps.google.com/?q=Bar+Constitución+Santiago',
  '+56 2 2664 1570'
),

(
  'La Piojera', 'pub', 'Aillavilú 1030', 'Santiago', 'Chile',
  -33.4378, -70.6504,
  ARRAY['Pisco Mistral', 'Pisco Tres Erres'],
  'budget',
  ARRAY['traditional', 'lively', 'authentic'],
  ARRAY['https://picsum.photos/800/600?random=3', 'https://picsum.photos/800/600?random=4'],
  'approved',
  'available',
  '2024-01-10 16:20:00+00'::timestamptz,
  'Carlos Mendoza',
  'Classic Chilean pub experience. Traditional piscolas with Mistral pisco.',
  'https://lapiojera.cl',
  'https://maps.google.com/?q=La+Piojera+Santiago',
  '+56 2 2681 9582'
),

-- Madrid, Spain venues
(
  'Pisco Bar Madrid', 'bar', 'Calle de Hortaleza 92', 'Madrid', 'Spain',
  40.4168, -3.7038,
  ARRAY['Pisco Capel', 'Pisco Alto del Carmen'],
  'premium',
  ARRAY['upscale', 'modern', 'sophisticated'],
  ARRAY['https://picsum.photos/800/600?random=5', 'https://picsum.photos/800/600?random=6'],
  'approved',
  'available',
  '2024-01-12 20:45:00+00'::timestamptz,
  'Ana Rodríguez',
  'Best pisco selection in Madrid! Authentic Chilean piscolas and cocktails.',
  'https://piscobar.madrid',
  'https://maps.google.com/?q=Pisco+Bar+Madrid',
  '+34 91 123 4567'
),

(
  'El Almacén del Pisco', 'liquor_store', 'Calle Mayor 84', 'Madrid', 'Spain',
  40.4150, -3.7067,
  ARRAY['Pisco Capel', 'Pisco Control C', 'Pisco Mistral'],
  'moderate',
  ARRAY['specialty store', 'knowledgeable staff'],
  ARRAY['https://picsum.photos/800/600?random=7'],
  'approved',
  'available',
  '2024-01-08 14:30:00+00'::timestamptz,
  'Pedro Silva',
  'Great selection of Chilean piscos. Staff knows their stuff about piscola preparation.',
  'https://almacendelpisco.es',
  'https://maps.google.com/?q=El+Almacén+del+Pisco+Madrid',
  '+34 91 987 6543'
),

-- London, UK venues
(
  'Chilean Corner', 'bar', '15 Goodge Street', 'London', 'United Kingdom',
  51.5186, -0.1339,
  ARRAY['Pisco Tres Erres'],
  'premium',
  ARRAY['modern', 'trendy', 'international'],
  ARRAY['https://picsum.photos/800/600?random=8', 'https://picsum.photos/800/600?random=9'],
  'approved',
  'temporarily_out',
  '2024-01-05 19:15:00+00'::timestamptz,
  'James Wilson',
  'Usually has Tres Erres but currently out of stock. Check back next week!',
  'https://chileancorner.london',
  'https://maps.google.com/?q=Chilean+Corner+London',
  '+44 20 7123 4567'
),

-- New York, USA venues
(
  'Andes Lounge', 'bar', '87 MacDougal St', 'New York', 'United States',
  40.7282, -74.0021,
  ARRAY['Pisco Capel', 'Pisco Alto del Carmen'],
  'premium',
  ARRAY['upscale', 'cocktail focused', 'Latin American'],
  ARRAY['https://picsum.photos/800/600?random=10', 'https://picsum.photos/800/600?random=11'],
  'approved',
  'available',
  '2024-01-18 21:00:00+00'::timestamptz,
  'Sofia Martinez',
  'Excellent pisco cocktails and authentic piscolas. Great atmosphere for Chilean expats.',
  'https://andeslounge.nyc',
  'https://maps.google.com/?q=Andes+Lounge+New+York',
  '+1 212 555 0123'
),

-- Sydney, Australia venues
(
  'The Pisco Collective', 'pub', '123 Crown Street', 'Sydney', 'Australia',
  -33.8688, 151.2093,
  ARRAY['Pisco Mistral'],
  'moderate',
  ARRAY['casual', 'friendly', 'outdoor seating'],
  ARRAY['https://picsum.photos/800/600?random=12'],
  'approved',
  'unavailable',
  '2024-01-03 16:45:00+00'::timestamptz,
  'Michael Chen',
  'Unfortunately stopped serving pisco due to supplier issues. Hoping to get it back soon.',
  'https://piscocollective.com.au',
  'https://maps.google.com/?q=The+Pisco+Collective+Sydney',
  '+61 2 9876 5432'
),

-- Valparaíso, Chile venues
(
  'Bar Cinzano', 'bar', 'Plaza Aníbal Pinto', 'Valparaíso', 'Chile',
  -33.0428, -71.6270,
  ARRAY['Pisco Capel', 'Pisco Control C', 'Pisco Mistral'],
  'budget',
  ARRAY['historic', 'bohemian', 'traditional'],
  ARRAY['https://picsum.photos/800/600?random=13', 'https://picsum.photos/800/600?random=14'],
  'approved',
  'available',
  '2024-01-20 17:30:00+00'::timestamptz,
  'Roberto Díaz',
  'Iconic Valparaíso bar. Classic piscolas in a historic setting. A must-visit!',
  null,
  'https://maps.google.com/?q=Bar+Cinzano+Valparaíso',
  '+56 32 221 3043'
);

-- Insert some comments
INSERT INTO public.comments (venue_id, user_id, content, rating, created_at)
SELECT 
  v.id,
  gen_random_uuid(), -- Mock user ID
  comment_data.content,
  comment_data.rating,
  comment_data.created_at::timestamptz
FROM public.venues v
CROSS JOIN (
  VALUES 
    ('Amazing piscolas! The bartender really knows how to make them properly. Will definitely come back!', 5, '2024-01-21 20:30:00+00'),
    ('Good atmosphere and decent pisco selection. Prices are reasonable.', 4, '2024-01-19 18:45:00+00'),
    ('Best piscola I''ve had outside of Chile! Authentic preparation and great service.', 5, '2024-01-17 19:20:00+00'),
    ('Nice place but pisco was a bit watered down. Still enjoyed the experience.', 3, '2024-01-15 21:10:00+00'),
    ('Perfect for homesick Chileans! Exactly like the piscolas back home.', 5, '2024-01-12 22:00:00+00')
) AS comment_data(content, rating, created_at)
WHERE v.name IN ('Bar Constitución', 'Pisco Bar Madrid', 'Andes Lounge', 'Bar Cinzano')
LIMIT 15; -- Limit to avoid too many comments

-- Insert some pisco verification history
INSERT INTO public.pisco_verifications (venue_id, user_id, verified_by, pisco_status, pisco_notes, created_at)
SELECT 
  v.id,
  gen_random_uuid(),
  verification_data.verified_by,
  verification_data.pisco_status,
  verification_data.pisco_notes,
  verification_data.created_at::timestamptz
FROM public.venues v
CROSS JOIN (
  VALUES 
    ('María González', 'available', 'Confirmed they have Capel and Control C in stock', '2024-01-15 18:30:00+00'),
    ('Carlos Mendoza', 'available', 'Traditional setup with Mistral pisco', '2024-01-10 16:20:00+00'),
    ('James Wilson', 'temporarily_out', 'Out of Tres Erres, expecting delivery next week', '2024-01-05 19:15:00+00'),
    ('Sofia Martinez', 'available', 'Full pisco bar with multiple brands', '2024-01-18 21:00:00+00')
) AS verification_data(verified_by, pisco_status, pisco_notes, created_at)
WHERE v.pisco_status != 'unverified'
LIMIT 8;

-- Show what was inserted
SELECT 'Venues inserted:' as info, count(*) as count FROM public.venues
UNION ALL
SELECT 'Comments inserted:', count(*) FROM public.comments
UNION ALL
SELECT 'Verifications inserted:', count(*) FROM public.pisco_verifications;
