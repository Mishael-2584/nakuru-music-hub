-- Migration: Create meeting_rooms table for video conferencing
-- This table stores meeting room information for Jitsi Meet integration

CREATE TABLE IF NOT EXISTS public.meeting_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name TEXT NOT NULL,
  meeting_url TEXT NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('lesson', 'practice', 'consultation')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  notes TEXT,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_teacher_id ON public.meeting_rooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_student_id ON public.meeting_rooms(student_id);
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_booking_id ON public.meeting_rooms(booking_id);
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_start_time ON public.meeting_rooms(start_time);
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_status ON public.meeting_rooms(status);
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_room_name ON public.meeting_rooms(room_name);

-- Enable RLS
ALTER TABLE public.meeting_rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Teachers can view and manage their own meeting rooms
CREATE POLICY "Teachers can manage their meeting rooms" ON public.meeting_rooms
  FOR ALL USING (
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE user_id = auth.uid()
    )
  );

-- Students can view their own meeting rooms
CREATE POLICY "Students can view their meeting rooms" ON public.meeting_rooms
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can manage all meeting rooms
CREATE POLICY "Admins can manage all meeting rooms" ON public.meeting_rooms
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Service role can manage all meeting rooms (for Edge Functions)
CREATE POLICY "Service role can manage meeting rooms" ON public.meeting_rooms
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meeting_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_meeting_rooms_updated_at
  BEFORE UPDATE ON public.meeting_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_rooms_updated_at();