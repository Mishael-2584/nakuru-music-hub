-- Migration: Create time slots and booking system
-- This migration sets up the complete time slot and booking infrastructure

-- 1. Create time slots table (only if it doesn't exist or has wrong structure)
DO $$
BEGIN
  -- Check if time_slots table exists and has the correct structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_slots' 
    AND column_name = 'teacher_id'
  ) THEN
    -- Drop existing table if it has wrong structure
    DROP TABLE IF EXISTS public.time_slots CASCADE;
    
    -- Create time slots table with correct structure
    CREATE TABLE public.time_slots (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
      day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      is_available BOOLEAN DEFAULT true,
      slot_type TEXT DEFAULT 'regular' CHECK (slot_type IN ('regular', 'makeup', 'exam_prep', 'performance')),
      max_students INTEGER DEFAULT 1,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(teacher_id, day_of_week, start_time, end_time)
    );
  END IF;
END $$;

-- 2. Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_slot_id UUID REFERENCES public.time_slots(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  lesson_type TEXT DEFAULT 'regular' CHECK (lesson_type IN ('regular', 'makeup', 'exam_prep', 'performance')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create teacher availability table (for weekly schedules)
CREATE TABLE IF NOT EXISTS public.teacher_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  is_available BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(teacher_id, day_of_week)
);

-- 4. Create recurring lessons table
CREATE TABLE IF NOT EXISTS public.recurring_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
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

-- Create RLS policies for time_slots (using email matching since user_id doesn't exist yet)
CREATE POLICY "Teachers can manage their own time slots" ON public.time_slots
  FOR ALL USING (
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Students can view available time slots" ON public.time_slots
  FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage all time slots" ON public.time_slots
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

-- Create RLS policies for bookings
CREATE POLICY "Teachers can view bookings for their slots" ON public.bookings
  FOR SELECT USING (
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

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
  FOR ALL USING (
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
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

-- Create function to update time slot availability when bookings change
CREATE OR REPLACE FUNCTION update_time_slot_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Update time slot availability based on bookings
  UPDATE public.time_slots 
  SET is_available = (
    SELECT COUNT(*) < max_students 
    FROM public.bookings 
    WHERE time_slot_id = time_slots.id 
    AND status != 'cancelled'
  )
  WHERE id IN (
    SELECT DISTINCT time_slot_id 
    FROM public.bookings 
    WHERE status != 'cancelled'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update time slot availability
DROP TRIGGER IF EXISTS trigger_update_time_slot_availability ON public.bookings;
CREATE TRIGGER trigger_update_time_slot_availability
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_time_slot_availability();

-- Create function to generate recurring lessons
CREATE OR REPLACE FUNCTION generate_recurring_lessons()
RETURNS TRIGGER AS $$
DECLARE
  start_date_var DATE;
  end_date DATE;
  lesson_date DATE;
  day_num INTEGER;
BEGIN
  -- Set start date to today if not specified
  start_date_var := COALESCE(NEW.start_date, CURRENT_DATE);
  end_date := COALESCE(NEW.end_date, start_date_var + INTERVAL '3 months');
  
  -- Convert day_of_week to number
  day_num := CASE NEW.day_of_week 
    WHEN 'Monday' THEN 1
    WHEN 'Tuesday' THEN 2
    WHEN 'Wednesday' THEN 3
    WHEN 'Thursday' THEN 4
    WHEN 'Friday' THEN 5
    WHEN 'Saturday' THEN 6
    WHEN 'Sunday' THEN 0
  END;
  
  -- Generate lessons based on frequency
  lesson_date := start_date_var;
  
  WHILE lesson_date <= end_date LOOP
    -- Check if this day matches the recurring pattern
    IF EXTRACT(DOW FROM lesson_date) = day_num THEN
      -- Create booking for this lesson
      INSERT INTO public.bookings (
        time_slot_id,
        student_id,
        teacher_id,
        booking_date,
        start_time,
        end_time,
        status,
        lesson_type
      ) VALUES (
        NEW.time_slot_id,
        NEW.student_id,
        NEW.teacher_id,
        lesson_date,
        NEW.start_time,
        NEW.end_time,
        'confirmed',
        'regular'
      );
    END IF;
    
    -- Move to next week/biweek/month based on frequency
    CASE NEW.frequency
      WHEN 'weekly' THEN lesson_date := lesson_date + INTERVAL '1 week';
      WHEN 'biweekly' THEN lesson_date := lesson_date + INTERVAL '2 weeks';
      WHEN 'monthly' THEN lesson_date := lesson_date + INTERVAL '1 month';
    END CASE;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to generate recurring lessons
DROP TRIGGER IF EXISTS trigger_generate_recurring_lessons ON public.recurring_lessons;
CREATE TRIGGER trigger_generate_recurring_lessons
  AFTER INSERT ON public.recurring_lessons
  FOR EACH ROW
  EXECUTE FUNCTION generate_recurring_lessons(); 