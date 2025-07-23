-- Add sessions_per_week to registrations
ALTER TABLE registrations ADD COLUMN sessions_per_week integer NOT NULL DEFAULT 1; 