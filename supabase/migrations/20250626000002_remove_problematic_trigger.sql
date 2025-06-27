-- Remove the problematic trigger that references user_id field
-- This trigger is trying to access NEW.user_id which doesn't exist in the registrations table

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS trigger_create_student_account ON public.registrations;

-- Drop the function that references user_id
DROP FUNCTION IF EXISTS create_student_account();

-- Verify the trigger is gone
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING TRIGGERS AFTER REMOVAL ===';
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

-- Test that the update works now
DO $$
DECLARE
    test_id UUID;
BEGIN
    RAISE NOTICE '=== TESTING REGISTRATION UPDATE AFTER FIX ===';
    
    -- Get a test registration ID
    SELECT id INTO test_id FROM public.registrations LIMIT 1;
    
    IF test_id IS NOT NULL THEN
        BEGIN
            UPDATE public.registrations 
            SET status = 'approved', updated_at = NOW()
            WHERE id = test_id;
            
            RAISE NOTICE '✅ SUCCESS: Update test passed for ID: %', test_id;
            
            -- Revert the test
            UPDATE public.registrations 
            SET status = 'pending', updated_at = NOW()
            WHERE id = test_id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ ERROR: Update test failed: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '⚠️ No registrations found to test with';
    END IF;
END $$; 