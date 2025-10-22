/*
  # Add Technology Courses to Damon Music Academy
  
  1. Add Technology course fees to the fees table
  2. Update course_type enum to include 'technology'
  3. Add Technology courses with proper pricing structure
*/

-- Add Technology course fees based on the pricing structure from Fees.tsx
INSERT INTO public.fees (course_type, course_name, price, duration, description, level, payment_frequency, mode, sessions_per_week, hours_per_session, currency, payment_type, is_active) VALUES

-- Technology Courses - Pay Per Class (1-on-1)
('technology', 'Web Design & Programming', 2200.00, '1 hour', '1-on-1 Web Design & Programming class - Personalized instruction', 'All Levels', 'per_class', 'At the Academy', 1, 1.0, 'KSh', 'per_class', true),
('technology', 'Web Design & Programming', 2200.00, '1 hour', '1-on-1 Web Design & Programming class - Online instruction', 'All Levels', 'per_class', 'Online (Global)', 1, 1.0, 'KSh', 'per_class', true),

-- Technology Courses - Pay Per Class (2 Students)
('technology', 'Web Design & Programming', 1500.00, '1 hour', '2 Students Web Design & Programming class - Small group learning', 'All Levels', 'per_class', 'At the Academy', 1, 1.0, 'KSh', 'per_class', true),
('technology', 'Web Design & Programming', 1500.00, '1 hour', '2 Students Web Design & Programming class - Online instruction', 'All Levels', 'per_class', 'Online (Global)', 1, 1.0, 'KSh', 'per_class', true),

-- Technology Courses - Pay Per Class (3-5 Students)
('technology', 'Web Design & Programming', 1200.00, '1 hour', '3-5 Students Web Design & Programming class - Group dynamics', 'All Levels', 'per_class', 'At the Academy', 1, 1.0, 'KSh', 'per_class', true),
('technology', 'Web Design & Programming', 1200.00, '1 hour', '3-5 Students Web Design & Programming class - Online instruction', 'All Levels', 'per_class', 'Online (Global)', 1, 1.0, 'KSh', 'per_class', true),

-- Technology Courses - Pay Per Class (6-10 Students)
('technology', 'Web Design & Programming', 1000.00, '1 hour', '6-10 Students Web Design & Programming class - Large group learning', 'All Levels', 'per_class', 'At the Academy', 1, 1.0, 'KSh', 'per_class', true),
('technology', 'Web Design & Programming', 1000.00, '1 hour', '6-10 Students Web Design & Programming class - Online instruction', 'All Levels', 'per_class', 'Online (Global)', 1, 1.0, 'KSh', 'per_class', true),

-- Technology Courses - Monthly Plans (based on 4 classes per month)
('technology', 'Web Design & Programming', 8800.00, '1 hour/week', 'Monthly plan - 1-on-1 Web Design & Programming at the academy', 'All Levels', 'monthly', 'At the Academy', 1, 1.0, 'KSh', 'monthly', true),
('technology', 'Web Design & Programming', 8800.00, '1 hour/week', 'Monthly plan - 1-on-1 Web Design & Programming online', 'All Levels', 'monthly', 'Online (Global)', 1, 1.0, 'KSh', 'monthly', true),

-- Technology Courses - Monthly Plans (2 Students)
('technology', 'Web Design & Programming', 6000.00, '1 hour/week', 'Monthly plan - 2 Students Web Design & Programming at the academy', 'All Levels', 'monthly', 'At the Academy', 1, 1.0, 'KSh', 'monthly', true),
('technology', 'Web Design & Programming', 6000.00, '1 hour/week', 'Monthly plan - 2 Students Web Design & Programming online', 'All Levels', 'monthly', 'Online (Global)', 1, 1.0, 'KSh', 'monthly', true),

-- Technology Courses - Monthly Plans (3-5 Students)
('technology', 'Web Design & Programming', 4800.00, '1 hour/week', 'Monthly plan - 3-5 Students Web Design & Programming at the academy', 'All Levels', 'monthly', 'At the Academy', 1, 1.0, 'KSh', 'monthly', true),
('technology', 'Web Design & Programming', 4800.00, '1 hour/week', 'Monthly plan - 3-5 Students Web Design & Programming online', 'All Levels', 'monthly', 'Online (Global)', 1, 1.0, 'KSh', 'monthly', true),

-- Technology Courses - Monthly Plans (6-10 Students)
('technology', 'Web Design & Programming', 4000.00, '1 hour/week', 'Monthly plan - 6-10 Students Web Design & Programming at the academy', 'All Levels', 'monthly', 'At the Academy', 1, 1.0, 'KSh', 'monthly', true),
('technology', 'Web Design & Programming', 4000.00, '1 hour/week', 'Monthly plan - 6-10 Students Web Design & Programming online', 'All Levels', 'monthly', 'Online (Global)', 1, 1.0, 'KSh', 'monthly', true);

-- Add comment to document the Technology course addition
COMMENT ON TABLE public.fees IS 'Course fees including Music, Production, Photography, Art, and Technology courses';
