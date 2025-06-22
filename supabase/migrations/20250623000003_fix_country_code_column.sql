-- Fix country_code column in registrations table
-- Ensure the column exists and has proper constraints

-- Add country_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registrations' 
        AND column_name = 'country_code'
    ) THEN
        ALTER TABLE public.registrations ADD COLUMN country_code TEXT DEFAULT '+254';
    END IF;
END $$;

-- Update existing records to have a default country code if they don't have one
UPDATE public.registrations 
SET country_code = '+254' 
WHERE country_code IS NULL;

-- Add constraint to ensure country_code is not null
ALTER TABLE public.registrations 
ALTER COLUMN country_code SET NOT NULL,
ALTER COLUMN country_code SET DEFAULT '+254';

-- Add comment for documentation
COMMENT ON COLUMN public.registrations.country_code IS 'Country code for phone number (e.g., +254 for Kenya)'; 