-- Forcefully remove any email unique constraints that might still exist
-- This will ensure multiple registrations from the same email are allowed

-- Check and remove any unique constraints on email field
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find any unique constraints on the email column
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'registrations' 
    AND ccu.column_name = 'email' 
    AND tc.constraint_type = 'UNIQUE';
    
    -- If found, drop it
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.registrations DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped unique constraint on email: %', constraint_name;
    ELSE
        RAISE NOTICE 'No unique constraint found on email column';
    END IF;
END $$;

-- Also check for any other unique constraints that might be on email
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'registrations' 
        AND ccu.column_name = 'email' 
        AND tc.constraint_type = 'UNIQUE'
    LOOP
        EXECUTE 'ALTER TABLE public.registrations DROP CONSTRAINT ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped additional unique constraint on email: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- Add a comment explaining why we allow multiple registrations per email
COMMENT ON COLUMN public.registrations.email IS 'Email address of the student (multiple registrations allowed for families or multiple courses)'; 