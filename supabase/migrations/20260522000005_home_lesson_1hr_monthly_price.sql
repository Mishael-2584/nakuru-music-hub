-- Home lesson monthly (1 hour/week): KSh 10,000 → KSh 12,000

UPDATE public.fees
SET price = 12000.00
WHERE course_type = 'music'
  AND course_name = 'Instrumental & Music Theory'
  AND payment_type = 'monthly'
  AND mode = 'Home (Nakuru & Environs)'
  AND duration ILIKE '%1 hour%'
  AND price = 10000.00;
