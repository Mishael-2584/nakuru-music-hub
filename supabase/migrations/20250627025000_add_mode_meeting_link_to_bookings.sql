-- Migration: Add mode and meeting_link columns to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS mode TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS meeting_link TEXT; 