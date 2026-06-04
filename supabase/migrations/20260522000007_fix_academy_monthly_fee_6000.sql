-- Fix academy monthly fee: invoices were using legacy KSh 5,600 (30 min row) instead of KSh 6,000 (1 hr)

UPDATE public.fees
SET price = 6000.00,
    is_active = true
WHERE course_type = 'music'
  AND course_name = 'Instrumental & Music Theory'
  AND payment_type = 'monthly'
  AND mode = 'At the Academy'
  AND duration ILIKE '%1 hour%';

-- Retire duplicate 30-minute academy monthly row (not on public fees page; caused wrong invoice rate)
UPDATE public.fees
SET is_active = false
WHERE course_type = 'music'
  AND course_name = 'Instrumental & Music Theory'
  AND payment_type = 'monthly'
  AND mode = 'At the Academy'
  AND duration ILIKE '%30%';
