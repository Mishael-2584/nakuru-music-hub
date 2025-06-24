-- Remove unique constraint on email field to allow multiple registrations from same email
-- This is needed because families might register multiple children or students might register for multiple courses

-- First, let's check if the constraint exists and drop it
DO $$
BEGIN
    -- Check if the unique constraint exists on email
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'registrations_email_key' 
        AND table_name = 'registrations'
    ) THEN
        ALTER TABLE public.registrations DROP CONSTRAINT registrations_email_key;
        RAISE NOTICE 'Dropped unique constraint on email field';
    ELSE
        RAISE NOTICE 'No unique constraint found on email field';
    END IF;
    
    -- Also check for any other unique constraints on email
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'UNIQUE' 
        AND table_name = 'registrations'
        AND constraint_name LIKE '%email%'
    ) THEN
        -- Get the constraint name and drop it
        EXECUTE (
            'ALTER TABLE public.registrations DROP CONSTRAINT ' || 
            (SELECT constraint_name FROM information_schema.table_constraints 
             WHERE constraint_type = 'UNIQUE' 
             AND table_name = 'registrations'
             AND constraint_name LIKE '%email%'
             LIMIT 1)
        );
        RAISE NOTICE 'Dropped additional unique constraint on email field';
    END IF;
END $$;

-- Add a comment explaining why we allow multiple registrations per email
COMMENT ON COLUMN public.registrations.email IS 'Email address of the student (multiple registrations allowed for families or multiple courses)'; 