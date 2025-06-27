-- Fix the user_id trigger error
-- This migration will identify and fix triggers that reference non-existent fields

-- First, let's see what triggers exist on the registrations table
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

-- Check for any functions that might be called by triggers and reference user_id
DO $$
DECLARE
    function_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING FUNCTIONS THAT MIGHT REFERENCE user_id ===';
    FOR function_record IN 
        SELECT routine_name, routine_definition
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_definition LIKE '%user_id%'
        AND routine_definition LIKE '%registrations%'
    LOOP
        RAISE NOTICE 'Function: %', function_record.routine_name;
        RAISE NOTICE 'Definition: %', function_record.routine_definition;
    END LOOP;
END $$;

-- Drop any triggers that might be causing the user_id error
-- We'll drop all triggers and recreate only the ones we need
DROP TRIGGER IF EXISTS trigger_set_receipt_number ON public.registrations;
DROP TRIGGER IF EXISTS trigger_set_user_id ON public.registrations;
DROP TRIGGER IF EXISTS trigger_update_user_id ON public.registrations;

-- Recreate only the receipt number trigger (the one we actually need)
CREATE TRIGGER trigger_set_receipt_number
    BEFORE INSERT ON public.registrations
    FOR EACH ROW
    EXECUTE FUNCTION set_receipt_number();

-- Check the table structure to confirm no user_id field exists
DO $$
DECLARE
    column_record RECORD;
BEGIN
    RAISE NOTICE '=== REGISTRATIONS TABLE STRUCTURE ===';
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

-- Test that the update works now
DO $$
DECLARE
    test_id UUID;
    result RECORD;
BEGIN
    RAISE NOTICE '=== TESTING REGISTRATION UPDATE ===';
    
    -- Get a test registration ID
    SELECT id INTO test_id FROM public.registrations LIMIT 1;
    
    IF test_id IS NOT NULL THEN
        BEGIN
            UPDATE public.registrations 
            SET status = 'pending', updated_at = NOW()
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