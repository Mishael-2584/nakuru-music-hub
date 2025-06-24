-- Check for any potential conflicts with auth.users table or triggers
-- that might be causing the email constraint issue

-- Check if there are any triggers on the registrations table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING TRIGGERS ON REGISTRATIONS TABLE ===';
    FOR trigger_record IN 
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'registrations'
        ORDER BY trigger_name
    LOOP
        RAISE NOTICE 'Trigger: % (Event: %, Action: %)', 
            trigger_record.trigger_name, 
            trigger_record.event_manipulation, 
            trigger_record.action_statement;
    END LOOP;
END $$;

-- Check if there are any functions that might be called by triggers
DO $$
DECLARE
    function_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING FUNCTIONS THAT MIGHT AFFECT REGISTRATIONS ===';
    FOR function_record IN 
        SELECT routine_name, routine_definition
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_definition LIKE '%registrations%'
        AND routine_definition LIKE '%email%'
    LOOP
        RAISE NOTICE 'Function: %', function_record.routine_name;
        RAISE NOTICE 'Definition: %', function_record.routine_definition;
    END LOOP;
END $$;

-- Check RLS policies on registrations table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING RLS POLICIES ON REGISTRATIONS TABLE ===';
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

-- Check if there are any foreign key constraints that might reference email
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING FOREIGN KEY CONSTRAINTS ===';
    FOR fk_record IN 
        SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name = 'registrations' OR ccu.table_name = 'registrations')
    LOOP
        RAISE NOTICE 'FK: % on %(%) references %(%)', 
            fk_record.constraint_name,
            fk_record.table_name,
            fk_record.column_name,
            fk_record.foreign_table_name,
            fk_record.foreign_column_name;
    END LOOP;
END $$;

-- Test inserting a registration to see what error we get
DO $$
DECLARE
    test_email TEXT := 'test_' || EXTRACT(EPOCH FROM NOW())::TEXT || '@example.com';
    result RECORD;
BEGIN
    RAISE NOTICE '=== TESTING REGISTRATION INSERT ===';
    RAISE NOTICE 'Testing with email: %', test_email;
    
    BEGIN
        INSERT INTO public.registrations (
            student_name, age, email, phone, instrument, experience, country_code
        ) VALUES (
            'Test Student', 15, test_email, '123456789', 'Piano', 'beginner', '+254'
        ) RETURNING id, email INTO result;
        
        RAISE NOTICE '✅ SUCCESS: Inserted registration with ID: %', result.id;
        
        -- Clean up test data
        DELETE FROM public.registrations WHERE email = test_email;
        RAISE NOTICE '✅ Cleaned up test data';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: %', SQLERRM;
        RAISE NOTICE '❌ Error Code: %', SQLSTATE;
    END;
END $$; 