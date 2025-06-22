
-- Update the existing events table to include more fields for better event management
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS registration_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS max_attendees integer,
ADD COLUMN IF NOT EXISTS current_attendees integer DEFAULT 0;

-- Create unique constraint on slug for events
ALTER TABLE public.events 
ADD CONSTRAINT events_slug_unique UNIQUE (slug);

-- Update the existing news table to include slug and status
ALTER TABLE public.news 
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- Create unique constraint on slug for news
ALTER TABLE public.news 
ADD CONSTRAINT news_slug_unique UNIQUE (slug);

-- Create event registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'confirmed'
);

-- Enable RLS on event_registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policy for event registrations (public can insert, admins can view all)
CREATE POLICY "Anyone can register for events" 
  ON public.event_registrations 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view all event registrations" 
  ON public.event_registrations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Update fees table to include better pricing structure
ALTER TABLE public.fees 
ADD COLUMN IF NOT EXISTS level text DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS payment_frequency text DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS registration_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS material_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS exam_fee numeric DEFAULT 0;
