-- Migration: Create time slots and booking system
-- This migration sets up the complete time slot and booking infrastructure

-- 1. Create time slots table
CREATE TABLE IF NOT EXISTS public.time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 2. Create bookings table
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

-- 3. Create teacher availability table (for weekly schedules)
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

-- 4. Create recurring lessons table
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

-- Create function to update time slot availability when booked
CREATE OR REPLACE FUNCTION update_time_slot_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the time slot availability based on current bookings
  UPDATE public.time_slots 
  SET is_available = (
    SELECT COUNT(*) < max_students 
    FROM public.bookings 
    WHERE time_slot_id = NEW.time_slot_id 
    AND status IN ('confirmed', 'pending')
  )
  WHERE id = NEW.time_slot_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update availability when bookings change
CREATE TRIGGER trigger_update_time_slot_availability
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_time_slot_availability();

-- Create function to generate recurring lessons
CREATE OR REPLACE FUNCTION generate_recurring_lessons()
RETURNS TRIGGER AS $$
DECLARE
  loop_date DATE := NEW.start_date;
  lesson_date DATE;
BEGIN
  WHILE loop_date <= COALESCE(NEW.end_date, (loop_date::timestamp + INTERVAL '1 year')::date) LOOP
    -- Find the next occurrence of the day_of_week
    lesson_date := loop_date + (CASE 
      WHEN NEW.day_of_week = 'Monday' THEN 0
      WHEN NEW.day_of_week = 'Tuesday' THEN 1
      WHEN NEW.day_of_week = 'Wednesday' THEN 2
      WHEN NEW.day_of_week = 'Thursday' THEN 3
      WHEN NEW.day_of_week = 'Friday' THEN 4
      WHEN NEW.day_of_week = 'Saturday' THEN 5
      WHEN NEW.day_of_week = 'Sunday' THEN 6
    END)::INTEGER;
    
    -- Insert the lesson
    INSERT INTO public.lessons (
      student_id, teacher_id, title, lesson_date, 
      start_time, end_time, lesson_type, status
    ) VALUES (
      NEW.student_id, NEW.teacher_id, 'Recurring Lesson', lesson_date,
      NEW.start_time, NEW.end_time, 'regular', 'scheduled'
    );
    
    -- Move to next week/month based on frequency
    IF NEW.frequency = 'weekly' THEN
      loop_date := (loop_date::timestamp + INTERVAL '7 days')::date;
    ELSIF NEW.frequency = 'biweekly' THEN
      loop_date := (loop_date::timestamp + INTERVAL '14 days')::date;
    ELSIF NEW.frequency = 'monthly' THEN
      loop_date := (loop_date::timestamp + INTERVAL '1 month')::date;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to generate lessons when recurring lesson is created
CREATE TRIGGER trigger_generate_recurring_lessons
  AFTER INSERT ON public.recurring_lessons
  FOR EACH ROW
  EXECUTE FUNCTION generate_recurring_lessons(); 