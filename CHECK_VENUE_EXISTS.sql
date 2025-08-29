-- Check if the specific venue exists
SELECT id, name, status, created_by, latitude, longitude
FROM public.venues 
WHERE id = '72271c03-77a6-4e6f-928c-dd016084fe6b';
