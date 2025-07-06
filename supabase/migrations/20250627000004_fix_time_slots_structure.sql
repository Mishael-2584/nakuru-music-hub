-- Migration: Fix time_slots table structure and add missing columns
-- This migration updates the existing time_slots table to match our requirements

-- Add missing columns to time_slots table if they don't exist
DO $$ 
BEGIN
    -- Add teacher_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'time_slots' AND column_name = 'teacher_id') THEN
        ALTER TABLE public.time_slots ADD COLUMN teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add slot_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'time_slots' AND column_name = 'slot_type') THEN
        ALTER TABLE public.time_slots ADD COLUMN slot_type TEXT DEFAULT 'regular' CHECK (slot_type IN ('regular', 'makeup', 'exam_prep', 'performance'));
    END IF;
    
    -- Add max_students column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'time_slots' AND column_name = 'max_students') THEN
        ALTER TABLE public.time_slots ADD COLUMN max_students INTEGER DEFAULT 1;
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'time_slots' AND column_name = 'description') THEN
        ALTER TABLE public.time_slots ADD COLUMN description TEXT;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'time_slots' AND column_name = 'updated_at') THEN
        ALTER TABLE public.time_slots ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'time_slots' AND constraint_name = 'time_slots_teacher_day_time_unique') THEN
        ALTER TABLE public.time_slots ADD CONSTRAINT time_slots_teacher_day_time_unique 
        UNIQUE(teacher_id, day_of_week, start_time, end_time);
    END IF;
END $$;

-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_slot_id UUID REFERENCES public.time_slots(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  lesson_type TEXT DEFAULT 'regular' CHECK (lesson_type IN ('regular', 'makeup', 'exam_prep', 'performance')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create teacher_availability table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.teacher_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  is_available BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(teacher_id, day_of_week)
);

-- Create recurring_lessons table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.recurring_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  time_slot_id UUID REFERENCES public.time_slots(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can manage their own time slots" ON public.time_slots;
DROP POLICY IF EXISTS "Students can view available time slots" ON public.time_slots;
DROP POLICY IF EXISTS "Teachers can view bookings for their slots" ON public.bookings;
DROP POLICY IF EXISTS "Students can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Students can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Students can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Teachers can manage their own availability" ON public.teacher_availability;
DROP POLICY IF EXISTS "Students can view teacher availability" ON public.teacher_availability;
DROP POLICY IF EXISTS "Teachers can manage their recurring lessons" ON public.recurring_lessons;
DROP POLICY IF EXISTS "Students can view their recurring lessons" ON public.recurring_lessons;

-- Create RLS policies for time_slots
CREATE POLICY "Teachers can manage their own time slots" ON public.time_slots
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view available time slots" ON public.time_slots
  FOR SELECT USING (is_available = true);

-- Create RLS policies for bookings
CREATE POLICY "Teachers can view bookings for their slots" ON public.bookings
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view their own bookings" ON public.bookings
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can update their own bookings" ON public.bookings
  FOR UPDATE USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Create RLS policies for teacher_availability
CREATE POLICY "Teachers can manage their own availability" ON public.teacher_availability
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view teacher availability" ON public.teacher_availability
  FOR SELECT USING (is_available = true);

-- Create RLS policies for recurring_lessons
CREATE POLICY "Teachers can manage their recurring lessons" ON public.recurring_lessons
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view their recurring lessons" ON public.recurring_lessons
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_slots_teacher_id ON public.time_slots(teacher_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_available ON public.time_slots(is_available);
CREATE INDEX IF NOT EXISTS idx_bookings_time_slot_id ON public.bookings(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON public.bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_teacher_id ON public.bookings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher_id ON public.teacher_availability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_recurring_lessons_teacher_id ON public.recurring_lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_recurring_lessons_student_id ON public.recurring_lessons(student_id); 