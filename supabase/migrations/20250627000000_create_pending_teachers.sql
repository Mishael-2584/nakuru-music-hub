-- Migration: Create pending_teachers table for teacher applications
CREATE TABLE IF NOT EXISTS public.pending_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  password text NOT NULL, -- Store hashed/encrypted in production
  bio text,
  experience text,
  category text NOT NULL,
  subjects text[] NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Index for quick lookup by email
CREATE INDEX IF NOT EXISTS idx_pending_teachers_email ON public.pending_teachers(email); 