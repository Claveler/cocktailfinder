-- Insert test venues
INSERT INTO public.venues (
  name, type, address, city, country, latitude, longitude,
  brands, price_range, ambiance, photos, status, 
  pisco_status, last_verified, verified_by, pisco_notes,
  website_url, google_maps_url, phone
) VALUES 

('Bar Constitución', 'bar', 'Constitución 172', 'Santiago', 'Chile',
  -33.4372, -70.6506,
  ARRAY['Pisco Capel', 'Pisco Control C'],
  'moderate',
  ARRAY['cozy', 'historic', 'intimate'],
  ARRAY['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=2'],
  'approved',
  'available',
  TIMESTAMP WITH TIME ZONE '2024-01-15 18:30:00+00',
  'María González',
  'Great selection of premium piscos. Capel and Control C available. Excellent piscolas!',
  'https://barcons.cl',
  'https://maps.google.com/?q=Bar+Constitución+Santiago',
  '+56 2 2664 1570'
),

('La Piojera', 'pub', 'Aillavilú 1030', 'Santiago', 'Chile',
  -33.4378, -70.6504,
  ARRAY['Pisco Mistral', 'Pisco Tres Erres'],
  'budget',
  ARRAY['traditional', 'lively', 'authentic'],
  ARRAY['https://picsum.photos/800/600?random=3', 'https://picsum.photos/800/600?random=4'],
  'approved',
  'available',
  TIMESTAMP WITH TIME ZONE '2024-01-10 16:20:00+00',
  'Carlos Mendoza',
  'Classic Chilean pub experience. Traditional piscolas with Mistral pisco.',
  'https://lapiojera.cl',
  'https://maps.google.com/?q=La+Piojera+Santiago',
  '+56 2 2681 9582'
),

('Pisco Bar Madrid', 'bar', 'Calle de Hortaleza 92', 'Madrid', 'Spain',
  40.4168, -3.7038,
  ARRAY['Pisco Capel', 'Pisco Alto del Carmen'],
  'premium',
  ARRAY['upscale', 'modern', 'sophisticated'],
  ARRAY['https://picsum.photos/800/600?random=5', 'https://picsum.photos/800/600?random=6'],
  'approved',
  'available',
  TIMESTAMP WITH TIME ZONE '2024-01-12 20:45:00+00',
  'Ana Rodríguez',
  'Best pisco selection in Madrid! Authentic Chilean piscolas and cocktails.',
  'https://piscobar.madrid',
  'https://maps.google.com/?q=Pisco+Bar+Madrid',
  '+34 91 123 4567'
),

('Andes Lounge', 'bar', '87 MacDougal St', 'New York', 'United States',
  40.7282, -74.0021,
  ARRAY['Pisco Capel', 'Pisco Alto del Carmen'],
  'premium',
  ARRAY['upscale', 'cocktail focused', 'Latin American'],
  ARRAY['https://picsum.photos/800/600?random=10', 'https://picsum.photos/800/600?random=11'],
  'approved',
  'available',
  TIMESTAMP WITH TIME ZONE '2024-01-18 21:00:00+00',
  'Sofia Martinez',
  'Excellent pisco cocktails and authentic piscolas. Great atmosphere for Chilean expats.',
  'https://andeslounge.nyc',
  'https://maps.google.com/?q=Andes+Lounge+New+York',
  '+1 212 555 0123'
);

-- Insert some comments
INSERT INTO public.comments (venue_id, user_id, content, rating, created_at)
SELECT 
  v.id,
  gen_random_uuid(),
  'Amazing piscolas! The bartender really knows how to make them properly.',
  5,
  TIMESTAMP WITH TIME ZONE '2024-01-21 20:30:00+00'
FROM public.venues v 
WHERE v.name = 'Bar Constitución'
LIMIT 1;

INSERT INTO public.comments (venue_id, user_id, content, rating, created_at)
SELECT 
  v.id,
  gen_random_uuid(),
  'Best pisco selection in the city. Highly recommended!',
  5,
  TIMESTAMP WITH TIME ZONE '2024-01-19 18:45:00+00'
FROM public.venues v 
WHERE v.name = 'Pisco Bar Madrid'
LIMIT 1;

-- Show results
SELECT 'Venues inserted: ' || count(*) FROM public.venues;
SELECT 'Comments inserted: ' || count(*) FROM public.comments;
