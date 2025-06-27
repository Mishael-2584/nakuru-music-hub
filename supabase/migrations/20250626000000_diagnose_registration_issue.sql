-- Diagnostic migration to test registration process
-- This will help identify why student registration is failing

-- Test 1: Check if we can insert a basic registration
DO $$
DECLARE
    test_email TEXT := 'test_' || EXTRACT(EPOCH FROM NOW())::TEXT || '@example.com';
    result RECORD;
BEGIN
    RAISE NOTICE '=== TEST 1: BASIC REGISTRATION INSERT ===';
    RAISE NOTICE 'Testing with email: %', test_email;
    
    BEGIN
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
            'Test Student', 
            15, 
            test_email, 
            '123456789', 
            'Piano', 
            'beginner',
            '+254',
            'Music',
            'beginner',
            'in-person',
            false,
            'pending'
        ) RETURNING id, email, receipt_number INTO result;
        
        RAISE NOTICE '✅ SUCCESS: Inserted registration with ID: %, Receipt: %', result.id, result.receipt_number;
        
        -- Clean up test data
        DELETE FROM public.registrations WHERE email = test_email;
        RAISE NOTICE '✅ Cleaned up test data';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: %', SQLERRM;
        RAISE NOTICE '❌ Error Code: %', SQLSTATE;
    END;
END $$;

-- Test 2: Check if time_slot_id constraint is the issue
DO $$
DECLARE
    test_email TEXT := 'test2_' || EXTRACT(EPOCH FROM NOW())::TEXT || '@example.com';
    result RECORD;
BEGIN
    RAISE NOTICE '=== TEST 2: REGISTRATION WITH EXPLICIT NULL time_slot_id ===';
    RAISE NOTICE 'Testing with email: %', test_email;
    
    BEGIN
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
            status,
            time_slot_id
        ) VALUES (
            'Test Student 2', 
            16, 
            test_email, 
            '987654321', 
            'Guitar', 
            'intermediate',
            '+254',
            'Music',
            'intermediate',
            'in-person',
            true,
            'pending',
            NULL
        ) RETURNING id, email, receipt_number INTO result;
        
        RAISE NOTICE '✅ SUCCESS: Inserted registration with explicit NULL time_slot_id, ID: %, Receipt: %', result.id, result.receipt_number;
        
        -- Clean up test data
        DELETE FROM public.registrations WHERE email = test_email;
        RAISE NOTICE '✅ Cleaned up test data';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: %', SQLERRM;
        RAISE NOTICE '❌ Error Code: %', SQLSTATE;
    END;
END $$;

-- Test 3: Check if receipt_number generation is working
DO $$
DECLARE
    receipt_num TEXT;
BEGIN
    RAISE NOTICE '=== TEST 3: RECEIPT NUMBER GENERATION ===';
    
    BEGIN
        SELECT generate_receipt_number() INTO receipt_num;
        RAISE NOTICE '✅ Receipt number generated: %', receipt_num;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Receipt number generation failed: %', SQLERRM;
    END;
END $$;

-- Test 4: Check RLS policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '=== TEST 4: RLS POLICIES CHECK ===';
    FOR policy_record IN 
        SELECT policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename = 'registrations'
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % (Permissive: %, Roles: %, Command: %)', 
            policy_record.policyname, 
            policy_record.permissive, 
            policy_record.roles, 
            policy_record.cmd;
        RAISE NOTICE 'Qual: %', policy_record.qual;
        RAISE NOTICE 'With Check: %', policy_record.with_check;
    END LOOP;
END $$;

-- Test 5: Check table constraints
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== TEST 5: TABLE CONSTRAINTS CHECK ===';
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
END $$; 