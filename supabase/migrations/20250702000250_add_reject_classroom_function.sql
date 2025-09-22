-- Add reject classroom functionality
-- Date: 2025-07-02

-- Create reject_classroom function
CREATE OR REPLACE FUNCTION reject_classroom(
  classroom_id_param UUID,
  rejected_by_param UUID,
  rejection_reason_param TEXT DEFAULT NULL
)
RETURNS TABLE (
  result_classroom_id UUID,
  result_status TEXT,
  result_rejection_reason TEXT
) AS $$
DECLARE
  updated_id UUID;
  updated_status TEXT;
  updated_reason TEXT;
BEGIN
  UPDATE public.classrooms AS c
  SET status = 'rejected',
      approved_at = now(),
      approved_by = rejected_by_param
  WHERE c.id = classroom_id_param
  RETURNING c.id, c.status INTO updated_id, updated_status;

  result_classroom_id := updated_id;
  result_status := updated_status;
  result_rejection_reason := rejection_reason_param;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION reject_classroom(UUID, UUID, TEXT) TO authenticated;
