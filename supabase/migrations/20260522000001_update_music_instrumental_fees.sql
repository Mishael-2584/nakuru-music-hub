-- Update Instrumental & Music Theory fees (monthly at academy + pay-per-class rates)

-- Monthly: At the Academy, 1 hour/week → KSh 6,000
UPDATE public.fees
SET price = 6000.00
WHERE course_type = 'music'
  AND course_name = 'Instrumental & Music Theory'
  AND payment_type = 'monthly'
  AND mode = 'At the Academy'
  AND duration ILIKE '%week%'
  AND price = 4800.00;

-- Pay per class: At the Academy, 1 hour → KSh 1,800
UPDATE public.fees
SET price = 1800.00
WHERE course_type = 'music'
  AND course_name = 'Instrumental & Music Theory'
  AND payment_type = 'per_class'
  AND mode = 'At the Academy'
  AND duration = '1 hour'
  AND price = 1500.00;

-- Pay per class: Home (Nakuru & Environs), 30 minutes → KSh 1,700 (insert if missing)
INSERT INTO public.fees (
  course_type, course_name, price, duration, description, level, payment_frequency,
  mode, sessions_per_week, hours_per_session, currency, payment_type, is_active
)
SELECT
  'music', 'Instrumental & Music Theory', 1700.00, '30 minutes',
  'Pay per class - 1-on-1 lessons at home (Nakuru & Environs)', 'All Levels', 'per_class',
  'Home (Nakuru & Environs)', 1, 0.5, 'KSh', 'per_class', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.fees
  WHERE course_type = 'music'
    AND course_name = 'Instrumental & Music Theory'
    AND payment_type = 'per_class'
    AND mode = 'Home (Nakuru & Environs)'
    AND duration ILIKE '%30%'
);

-- Pay per class: Home (Nakuru & Environs), 1 hour → KSh 3,200
UPDATE public.fees
SET price = 3200.00
WHERE course_type = 'music'
  AND course_name = 'Instrumental & Music Theory'
  AND payment_type = 'per_class'
  AND mode = 'Home (Nakuru & Environs)'
  AND duration = '1 hour'
  AND price = 2700.00;

-- Pay per class: Online (Global), 1 hour → $15
UPDATE public.fees
SET price = 15.00
WHERE course_type = 'music'
  AND course_name = 'Instrumental & Music Theory'
  AND payment_type = 'per_class'
  AND mode = 'Online (Global)'
  AND duration = '1 hour'
  AND price = 11.00;
