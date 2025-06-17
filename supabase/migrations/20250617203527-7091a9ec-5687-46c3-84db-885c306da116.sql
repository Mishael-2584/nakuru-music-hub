
-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news table
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fees table
CREATE TABLE public.fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_type TEXT NOT NULL,
  course_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table for other services
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_range TEXT,
  category TEXT NOT NULL,
  features TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create time slots table
CREATE TABLE public.time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  instructor_name TEXT,
  max_capacity INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam bodies table
CREATE TABLE public.exam_bodies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update registrations table with new fields
ALTER TABLE public.registrations 
ADD COLUMN location TEXT,
ADD COLUMN course_category TEXT DEFAULT 'music',
ADD COLUMN owns_instrument BOOLEAN,
ADD COLUMN learning_mode TEXT DEFAULT 'in-person',
ADD COLUMN proficiency_level TEXT DEFAULT 'beginner',
ADD COLUMN time_slot_id UUID REFERENCES public.time_slots(id);

-- Enable Row Level Security for new tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_bodies ENABLE ROW LEVEL SECURITY;

-- Create policies for events (public read, admin write)
CREATE POLICY "Anyone can view events" 
  ON public.events 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage events" 
  ON public.events 
  FOR ALL 
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- Create policies for news (public read, admin write)
CREATE POLICY "Anyone can view news" 
  ON public.news 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage news" 
  ON public.news 
  FOR ALL 
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- Create policies for fees (public read, admin write)
CREATE POLICY "Anyone can view fees" 
  ON public.fees 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage fees" 
  ON public.fees 
  FOR ALL 
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- Create policies for services (public read, admin write)
CREATE POLICY "Anyone can view services" 
  ON public.services 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage services" 
  ON public.services 
  FOR ALL 
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- Create policies for time slots (public read, admin write)
CREATE POLICY "Anyone can view time slots" 
  ON public.time_slots 
  FOR SELECT 
  USING (is_available = true);

CREATE POLICY "Admins can manage time slots" 
  ON public.time_slots 
  FOR ALL 
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- Create policies for exam bodies (public read, admin write)
CREATE POLICY "Anyone can view exam bodies" 
  ON public.exam_bodies 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage exam bodies" 
  ON public.exam_bodies 
  FOR ALL 
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- Insert default exam bodies
INSERT INTO public.exam_bodies (name, abbreviation, description) VALUES
('Associated Board of the Royal Schools of Music', 'ABRSM', 'World-leading provider of music assessments, supporting learners at every stage of their musical journey'),
('London College of Music', 'LCM', 'One of the oldest music institutions in the UK, offering internationally recognized qualifications'),
('Rockschool', 'RSL', 'Contemporary music qualifications covering rock, pop, and contemporary genres');

-- Insert default services
INSERT INTO public.services (name, description, category, price_range, features) VALUES
('Music Production & Recording', 'Professional music production and recording services with state-of-the-art equipment', 'production', 'KSh 5,000 - 50,000', ARRAY['Professional recording', 'Mixing & mastering', 'Beat production', 'Vocal coaching']),
('Photography Services', 'Professional photography for events, portraits, and music videos', 'photography', 'KSh 10,000 - 100,000', ARRAY['Event photography', 'Portrait sessions', 'Music video shoots', 'Studio photography']),
('Sound System Rental', 'High-quality sound system rental for events and performances', 'rental', 'KSh 15,000 - 200,000', ARRAY['PA systems', 'Microphones', 'Mixing boards', 'Technical support']),
('Instrument Purchase', 'Wide selection of musical instruments for purchase', 'instruments', 'KSh 5,000 - 500,000', ARRAY['New & used instruments', 'Expert advice', 'Maintenance support', 'Trade-in options']);

-- Insert default time slots
INSERT INTO public.time_slots (day_of_week, start_time, end_time, instructor_name, max_capacity) VALUES
(1, '09:00', '10:00', 'Mr. James', 1),
(1, '10:00', '11:00', 'Ms. Sarah', 1),
(1, '14:00', '15:00', 'Mr. David', 1),
(2, '09:00', '10:00', 'Ms. Grace', 1),
(2, '15:00', '16:00', 'Mr. James', 1),
(3, '10:00', '11:00', 'Ms. Sarah', 1),
(4, '09:00', '10:00', 'Mr. David', 1),
(4, '16:00', '17:00', 'Ms. Grace', 1),
(5, '09:00', '10:00', 'Mr. James', 1),
(5, '14:00', '15:00', 'Ms. Sarah', 1);

-- Insert sample fees
INSERT INTO public.fees (course_type, course_name, price, duration, description) VALUES
('music', 'Piano Lessons', 8000.00, 'Per Month (4 sessions)', 'Individual piano lessons with certified instructors'),
('music', 'Guitar Lessons', 7000.00, 'Per Month (4 sessions)', 'Acoustic and electric guitar instruction'),
('music', 'Voice Training', 9000.00, 'Per Month (4 sessions)', 'Professional vocal coaching and technique'),
('music', 'Violin Lessons', 8500.00, 'Per Month (4 sessions)', 'Classical and contemporary violin instruction'),
('music', 'Drums Lessons', 7500.00, 'Per Month (4 sessions)', 'Complete drum kit instruction'),
('production', 'Music Production Course', 25000.00, 'Per Month (8 sessions)', 'Learn professional music production techniques'),
('art', 'Photography Course', 20000.00, 'Per Month (6 sessions)', 'Digital photography and editing skills');

-- Update profiles table to add super_admin role constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'super_admin'));

-- Create function to limit admin count
CREATE OR REPLACE FUNCTION check_admin_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') >= 3 THEN
      RAISE EXCEPTION 'Maximum of 3 admin accounts allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce admin limit
CREATE TRIGGER enforce_admin_limit
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_admin_limit();
