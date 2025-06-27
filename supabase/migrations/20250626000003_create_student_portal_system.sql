-- Create comprehensive student portal system
-- This migration sets up the complete student authentication and portal infrastructure

-- 1. First, let's ensure the students table has all necessary fields
CREATE TABLE IF NOT EXISTS public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  country_code TEXT DEFAULT '+254',
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  instrument TEXT NOT NULL,
  experience TEXT NOT NULL,
  proficiency_level TEXT DEFAULT 'beginner',
  learning_mode TEXT DEFAULT 'in-person',
  owns_instrument BOOLEAN DEFAULT false,
  location TEXT,
  medical_condition TEXT DEFAULT 'no',
  medical_details TEXT,
  goals TEXT,
  preferred_schedule TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'suspended')),
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create student profiles table for portal-specific data
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  profile_picture_url TEXT,
  bio TEXT,
  achievements TEXT[],
  practice_goals TEXT,
  preferred_communication TEXT DEFAULT 'email' CHECK (preferred_communication IN ('email', 'phone', 'sms')),
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "portal": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  lesson_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  lesson_type TEXT DEFAULT 'regular' CHECK (lesson_type IN ('regular', 'makeup', 'exam_prep', 'performance')),
  notes TEXT,
  materials_url TEXT[],
  attendance_status TEXT DEFAULT 'pending' CHECK (attendance_status IN ('present', 'absent', 'late', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create practice logs table
CREATE TABLE IF NOT EXISTS public.practice_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  practice_date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  practice_type TEXT DEFAULT 'regular' CHECK (practice_type IN ('regular', 'assignment', 'performance_prep', 'technique')),
  notes TEXT,
  pieces_practiced TEXT[],
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create lesson materials table
CREATE TABLE IF NOT EXISTS public.lesson_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Create messages table for portal communication
CREATE TABLE IF NOT EXISTS public.portal_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  message_type TEXT DEFAULT 'general' CHECK (message_type IN ('general', 'lesson', 'assignment', 'payment', 'emergency')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('tuition', 'materials', 'exam_fee', 'other')),
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mpesa', 'bank_transfer', 'card')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  due_date DATE,
  paid_date DATE,
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Create progress reports table
CREATE TABLE IF NOT EXISTS public.progress_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  report_period TEXT NOT NULL, -- e.g., 'January 2024', 'Q1 2024'
  report_date DATE NOT NULL,
  overall_progress TEXT,
  strengths TEXT[],
  areas_for_improvement TEXT[],
  recommendations TEXT,
  next_goals TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for students (students can view their own data)
CREATE POLICY "Students can view own data" ON public.students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can update own data" ON public.students
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for student profiles
CREATE POLICY "Students can view own profile" ON public.student_profiles
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can update own profile" ON public.student_profiles
  FOR UPDATE USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Create RLS policies for lessons
CREATE POLICY "Students can view own lessons" ON public.lessons
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Create RLS policies for practice logs
CREATE POLICY "Students can view own practice logs" ON public.practice_logs
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can insert own practice logs" ON public.practice_logs
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can update own practice logs" ON public.practice_logs
  FOR UPDATE USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Create RLS policies for assignments
CREATE POLICY "Students can view own assignments" ON public.assignments
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can update own assignments" ON public.assignments
  FOR UPDATE USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Create RLS policies for messages
CREATE POLICY "Users can view messages they sent or received" ON public.portal_messages
  FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY "Users can send messages" ON public.portal_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can mark their messages as read" ON public.portal_messages
  FOR UPDATE USING (
    recipient_id = auth.uid()
  );

-- Create RLS policies for payments
CREATE POLICY "Students can view own payments" ON public.payments
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Create RLS policies for attendance
CREATE POLICY "Students can view own attendance" ON public.attendance
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Create RLS policies for progress reports
CREATE POLICY "Students can view own progress reports" ON public.progress_reports
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Admin policies (admins can view all data)
CREATE POLICY "Admins can view all student data" ON public.students
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can view all student profiles" ON public.student_profiles
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage all lessons" ON public.lessons
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage all practice logs" ON public.practice_logs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage all assignments" ON public.assignments
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage all messages" ON public.portal_messages
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage all attendance" ON public.attendance
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage all progress reports" ON public.progress_reports
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON public.lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON public.lessons(lesson_date);
CREATE INDEX IF NOT EXISTS idx_practice_logs_student_id ON public.practice_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_practice_logs_date ON public.practice_logs(practice_date);
CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON public.assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON public.portal_messages(sender_id, recipient_id);

-- Create function to automatically create student profile when student is created
CREATE OR REPLACE FUNCTION create_student_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.student_profiles (student_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create student profile
CREATE TRIGGER trigger_create_student_profile
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION create_student_profile();

-- Create function to update student when registration is approved
CREATE OR REPLACE FUNCTION create_student_from_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create student when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.students (
      registration_id,
      student_name,
      age,
      email,
      phone,
      country_code,
      parent_name,
      parent_phone,
      instrument,
      experience,
      proficiency_level,
      learning_mode,
      owns_instrument,
      location,
      medical_condition,
      medical_details,
      goals,
      preferred_schedule
    ) VALUES (
      NEW.id,
      NEW.student_name,
      NEW.age,
      NEW.email,
      NEW.phone,
      NEW.country_code,
      NEW.parent_name,
      NEW.parent_phone,
      NEW.instrument,
      NEW.experience,
      NEW.proficiency_level,
      NEW.learning_mode,
      NEW.owns_instrument,
      NEW.location,
      NEW.medical_condition,
      NEW.medical_details,
      NEW.goals,
      NEW.preferred_schedule
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to create student when registration is approved
CREATE TRIGGER trigger_create_student_from_registration
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION create_student_from_registration(); 