-- Migration: Create teachers table for approved teachers
CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  password text NOT NULL, -- Store hashed/encrypted in production
  bio text,
  experience text,
  category text NOT NULL,
  subjects text[] NOT NULL,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Index for quick lookup by email
CREATE INDEX IF NOT EXISTS idx_teachers_email ON public.teachers(email); 