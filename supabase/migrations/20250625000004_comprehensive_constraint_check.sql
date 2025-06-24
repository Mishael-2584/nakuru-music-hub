-- Comprehensive check and removal of ALL email constraints
-- This will ensure no unique constraints exist on the email field

-- First, let's see what constraints exist
DO $$
DECLARE
    constraint_record RECORD;
    index_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING ALL CONSTRAINTS ON REGISTRATIONS TABLE ===';
    
    -- Check all table constraints
    FOR constraint_record IN 
        SELECT tc.constraint_name, tc.constraint_type, ccu.column_name
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'registrations'
        ORDER BY tc.constraint_type, ccu.column_name
    LOOP
        RAISE NOTICE 'Constraint: % (Type: %, Column: %)', 
            constraint_record.constraint_name, 
            constraint_record.constraint_type, 
            constraint_record.column_name;
    END LOOP;
    
    RAISE NOTICE '=== CHECKING ALL INDEXES ON REGISTRATIONS TABLE ===';
    
    -- Check all indexes
    FOR index_record IN 
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'registrations'
        ORDER BY indexname
    LOOP
        RAISE NOTICE 'Index: % - %', index_record.indexname, index_record.indexdef;
    END LOOP;
END $$;

-- Remove any unique constraints on email (multiple approaches)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Method 1: Check for specific constraint names
    FOR constraint_name IN 
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'registrations' 
        AND ccu.column_name = 'email' 
        AND tc.constraint_type = 'UNIQUE'
    LOOP
        EXECUTE 'ALTER TABLE public.registrations DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped unique constraint: %', constraint_name;
    END LOOP;
    
    -- Method 2: Check for constraints with email in the name
    FOR constraint_name IN 
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'registrations' 
        AND tc.constraint_type = 'UNIQUE'
        AND tc.constraint_name LIKE '%email%'
    LOOP
        EXECUTE 'ALTER TABLE public.registrations DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped email-related constraint: %', constraint_name;
    END LOOP;
    
    -- Method 3: Check for any unique constraints that might affect email
    FOR constraint_name IN 
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'registrations' 
        AND tc.constraint_type = 'UNIQUE'
        AND tc.constraint_name NOT LIKE '%receipt%'
        AND tc.constraint_name NOT LIKE '%id%'
        AND tc.constraint_name NOT LIKE '%primary%'
    LOOP
        EXECUTE 'ALTER TABLE public.registrations DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped potential email constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove any unique indexes on email
DO $$
DECLARE
    index_name TEXT;
BEGIN
    FOR index_name IN 
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'registrations'
        AND indexdef LIKE '%UNIQUE%'
        AND indexdef LIKE '%email%'
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || index_name;
        RAISE NOTICE 'Dropped unique index: %', index_name;
    END LOOP;
END $$;

-- Verify the table structure
DO $$
DECLARE
    column_record RECORD;
BEGIN
    RAISE NOTICE '=== FINAL TABLE STRUCTURE ===';
    FOR column_record IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'registrations'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % (Type: %, Nullable: %, Default: %)', 
            column_record.column_name, 
            column_record.data_type, 
            column_record.is_nullable, 
            column_record.column_default;
    END LOOP;
END $$; 