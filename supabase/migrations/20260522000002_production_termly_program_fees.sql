-- Termly production programs (match public Fees page)

INSERT INTO public.fees (
  course_type, course_name, price, duration, description, level, payment_frequency,
  mode, sessions_per_week, hours_per_session, currency, payment_type, is_active
)
SELECT 'production', 'Music Production', 45500.00, '1st Term',
  '3 sessions/week, 1 hour each - Music Production first term', 'All Levels', 'term',
  'At the Academy', 3, 1.0, 'KSh', 'term', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.fees WHERE course_type = 'production' AND course_name = 'Music Production'
    AND payment_type = 'term' AND duration = '1st Term'
);

INSERT INTO public.fees (
  course_type, course_name, price, duration, description, level, payment_frequency,
  mode, sessions_per_week, hours_per_session, currency, payment_type, is_active
)
SELECT 'production', 'Music Production', 42500.00, 'Final Term',
  '3 sessions/week, 1 hour each - Music Production final term', 'All Levels', 'term',
  'At the Academy', 3, 1.0, 'KSh', 'term', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.fees WHERE course_type = 'production' AND course_name = 'Music Production'
    AND payment_type = 'term' AND duration = 'Final Term'
);

INSERT INTO public.fees (
  course_type, course_name, price, duration, description, level, payment_frequency,
  mode, sessions_per_week, hours_per_session, currency, payment_type, is_active
)
SELECT 'production', 'Live Sound Engineering', 28000.00, '1st Term',
  '2 sessions/week, 2 hours each - Live Sound Engineering first term', 'All Levels', 'term',
  'At the Academy', 2, 2.0, 'KSh', 'term', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.fees WHERE course_type = 'production' AND course_name = 'Live Sound Engineering'
    AND payment_type = 'term' AND duration = '1st Term'
);

INSERT INTO public.fees (
  course_type, course_name, price, duration, description, level, payment_frequency,
  mode, sessions_per_week, hours_per_session, currency, payment_type, is_active
)
SELECT 'production', 'Live Sound Engineering', 26000.00, 'Final Term',
  '2 sessions/week, 2 hours each - Live Sound Engineering final term', 'All Levels', 'term',
  'At the Academy', 2, 2.0, 'KSh', 'term', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.fees WHERE course_type = 'production' AND course_name = 'Live Sound Engineering'
    AND payment_type = 'term' AND duration = 'Final Term'
);

INSERT INTO public.fees (
  course_type, course_name, price, duration, description, level, payment_frequency,
  mode, sessions_per_week, hours_per_session, currency, payment_type, is_active
)
SELECT 'production', 'Live Sound (Short Course)', 18000.00, 'per month',
  '3 sessions/week, 1 hour each - Live Sound short course (monthly)', 'All Levels', 'monthly',
  'At the Academy', 3, 1.0, 'KSh', 'monthly', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.fees WHERE course_type = 'production' AND course_name = 'Live Sound (Short Course)'
    AND payment_type = 'monthly'
);

UPDATE public.fees
SET is_active = false
WHERE course_type = 'production'
  AND course_name = 'Music Production & Sound Engineering';
