-- Grant execute permission to anonymous users for trial booking function
-- This allows anyone to submit a trial booking without being logged in

GRANT EXECUTE ON FUNCTION public.create_trial_booking(
  TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, UUID, UUID
) TO anon;

-- Also ensure authenticated users can execute it
GRANT EXECUTE ON FUNCTION public.create_trial_booking(
  TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, UUID, UUID
) TO authenticated;

-- And service role
GRANT EXECUTE ON FUNCTION public.create_trial_booking(
  TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, UUID, UUID
) TO service_role;
