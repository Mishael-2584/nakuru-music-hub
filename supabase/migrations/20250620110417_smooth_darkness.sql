/*
  # Update fees structure with correct pricing

  1. Clear existing fees data
  2. Insert new fee structure with correct pricing
  3. Update table structure to accommodate new pricing model
*/

-- Clear existing fees data
DELETE FROM public.fees;

-- Update fees table structure to better accommodate the new pricing model
ALTER TABLE public.fees 
ADD COLUMN IF NOT EXISTS mode TEXT,
ADD COLUMN IF NOT EXISTS sessions_per_week INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS hours_per_session DECIMAL(3,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KSh',
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'monthly' CHECK (payment_type IN ('monthly', 'per_class', 'term'));

-- Insert new fee structure based on the provided pricing

-- Instrumental & Music Theory Lessons - Monthly Plan
INSERT INTO public.fees (course_type, course_name, price, duration, description, level, payment_frequency, mode, sessions_per_week, hours_per_session, currency, payment_type, is_active) VALUES
('music', 'Instrumental & Music Theory', 4800.00, '1 hour/week', 'Monthly plan - 1-on-1 lessons at the academy', 'All Levels', 'monthly', 'At the Academy', 1, 1.0, 'KSh', 'monthly', true),
('music', 'Instrumental & Music Theory', 5600.00, '30 minutes/week', 'Monthly plan - 1-on-1 lessons at the academy', 'All Levels', 'monthly', 'At the Academy', 1, 0.5, 'KSh', 'monthly', true),
('music', 'Instrumental & Music Theory', 10000.00, '1 hour/week', 'Monthly plan - 1-on-1 lessons at home (Nakuru & Environs)', 'All Levels', 'monthly', 'Home (Nakuru & Environs)', 1, 1.0, 'KSh', 'monthly', true),
('music', 'Instrumental & Music Theory', 44.00, '1 hour/week', 'Monthly plan - 1-on-1 online lessons (Global)', 'All Levels', 'monthly', 'Online (Global)', 1, 1.0, '$', 'monthly', true),

-- Instrumental & Music Theory Lessons - Pay Per Class
('music', 'Instrumental & Music Theory', 1500.00, '1 hour', 'Pay per class - 1-on-1 lessons at the academy', 'All Levels', 'per_class', 'At the Academy', 1, 1.0, 'KSh', 'per_class', true),
('music', 'Instrumental & Music Theory', 1600.00, '30 minutes', 'Pay per class - 1-on-1 lessons at the academy', 'All Levels', 'per_class', 'At the Academy', 1, 0.5, 'KSh', 'per_class', true),
('music', 'Instrumental & Music Theory', 2700.00, '1 hour', 'Pay per class - 1-on-1 lessons at home (Nakuru & Environs)', 'All Levels', 'per_class', 'Home (Nakuru & Environs)', 1, 1.0, 'KSh', 'per_class', true),
('music', 'Instrumental & Music Theory', 11.00, '1 hour', 'Pay per class - 1-on-1 online lessons (Global)', 'All Levels', 'per_class', 'Online (Global)', 1, 1.0, '$', 'per_class', true),

-- Music Production & Sound Engineering
('production', 'Music Production & Sound Engineering', 45500.00, '1st Term', '3 sessions/week, 1 hour each - First term', 'All Levels', 'term', 'At the Academy', 3, 1.0, 'KSh', 'term', true),
('production', 'Music Production & Sound Engineering', 42500.00, 'Final Term', '3 sessions/week, 1 hour each - Final term', 'All Levels', 'term', 'At the Academy', 3, 1.0, 'KSh', 'term', true),

-- Photography & Videography
('photography', 'Photography & Videography', 45500.00, '1st Term', '3 sessions/week, 1 hour each - First term', 'All Levels', 'term', 'At the Academy', 3, 1.0, 'KSh', 'term', true),
('photography', 'Photography & Videography', 42500.00, 'Final Term', '3 sessions/week, 1 hour each - Final term', 'All Levels', 'term', 'At the Academy', 3, 1.0, 'KSh', 'term', true),

-- Art Classes
('art', 'Art Classes', 4000.00, '1 session/week', '2-3 hours per session - Monthly fee', 'All Levels', 'monthly', 'At the Academy', 1, 2.5, 'KSh', 'monthly', true);