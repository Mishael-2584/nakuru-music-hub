-- Fix registration deletion issues
-- This migration ensures that registrations can be properly deleted

-- First, let's check if there are any foreign key constraints preventing deletion
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING FOREIGN KEY CONSTRAINTS ON REGISTRATIONS ===';
    FOR fk_record IN 
        SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints rc
            ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name = 'registrations' OR ccu.table_name = 'registrations')
    LOOP
        RAISE NOTICE 'FK: % on %(%) references %(%) with delete rule: %', 
            fk_record.constraint_name,
            fk_record.table_name,
            fk_record.column_name,
            fk_record.foreign_table_name,
            fk_record.foreign_column_name,
            fk_record.delete_rule;
    END LOOP;
END $$;

-- Ensure the students table has proper foreign key constraint
-- If the constraint doesn't exist or has wrong delete rule, recreate it
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_registration_id_fkey'
    ) THEN
        ALTER TABLE public.students DROP CONSTRAINT students_registration_id_fkey;
    END IF;
    
    -- Create the constraint with proper delete rule
    ALTER TABLE public.students 
    ADD CONSTRAINT students_registration_id_fkey 
    FOREIGN KEY (registration_id) 
    REFERENCES public.registrations(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Recreated students_registration_id foreign key constraint with ON DELETE SET NULL';
END $$;

-- Test deletion functionality
DO $$
DECLARE
    test_registration_id UUID;
    test_student_id UUID;
BEGIN
    RAISE NOTICE '=== TESTING REGISTRATION DELETION ===';
    
    -- Create a test registration
    INSERT INTO public.registrations (
        student_name, 
        age, 
        email, 
        phone, 
        instrument, 
        experience,
        country_code,
        course_category,
        proficiency_level,
        learning_mode,
        owns_instrument,
        status
    ) VALUES (
        'Test Delete Student', 
        15, 
        'test_delete_' || EXTRACT(EPOCH FROM NOW())::TEXT || '@example.com', 
        '123456789', 
        'Piano', 
        'beginner',
        '+254',
        'Music',
        'beginner',
        'in-person',
        false,
        'pending'
    ) RETURNING id INTO test_registration_id;
    
    RAISE NOTICE '✅ Created test registration: %', test_registration_id;
    
    -- Create a test student linked to this registration
    INSERT INTO public.students (
        registration_id,
        student_name,
        age,
        email,
        phone,
        country_code,
        instrument,
        experience,
        proficiency_level,
        learning_mode,
        owns_instrument,
        location,
        status
    ) VALUES (
        test_registration_id,
        'Test Delete Student',
        15,
        'test_delete_' || EXTRACT(EPOCH FROM NOW())::TEXT || '@example.com',
        '123456789',
        '+254',
        'Piano',
        'beginner',
        'beginner',
        'in-person',
        false,
        'Nairobi',
        'active'
    ) RETURNING id INTO test_student_id;
    
    RAISE NOTICE '✅ Created test student: % linked to registration: %', test_student_id, test_registration_id;
    
    -- Test deletion
    BEGIN
        DELETE FROM public.registrations WHERE id = test_registration_id;
        RAISE NOTICE '✅ SUCCESS: Registration deleted successfully';
        
        -- Check if student still exists but registration_id is null
        IF EXISTS (
            SELECT 1 FROM public.students 
            WHERE id = test_student_id 
            AND registration_id IS NULL
        ) THEN
            RAISE NOTICE '✅ SUCCESS: Student exists but registration_id is now NULL';
        ELSE
            RAISE NOTICE '❌ ERROR: Student registration_id not set to NULL';
        END IF;
        
        -- Clean up test student
        DELETE FROM public.students WHERE id = test_student_id;
        RAISE NOTICE '✅ Cleaned up test student';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: Failed to delete registration: %', SQLERRM;
        
        -- Clean up on error
        DELETE FROM public.students WHERE id = test_student_id;
        DELETE FROM public.registrations WHERE id = test_registration_id;
    END;
END $$; 