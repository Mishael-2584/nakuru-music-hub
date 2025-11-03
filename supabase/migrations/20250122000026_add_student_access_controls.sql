-- Add access control fields for students to support invoice gating and suspensions

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS is_access_suspended BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspension_updated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS allow_unpaid_access BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.students.is_access_suspended IS 'When true the student portal features are locked until reactivated by an admin';
COMMENT ON COLUMN public.students.suspension_reason IS 'Reason provided by the admin when suspending access';
COMMENT ON COLUMN public.students.suspension_updated_at IS 'Timestamp of the latest suspension status change';
COMMENT ON COLUMN public.students.allow_unpaid_access IS 'If true the student can access classes even if the first invoice is unpaid';

-- Ensure existing rows have explicit defaults
UPDATE public.students
SET is_access_suspended = COALESCE(is_access_suspended, FALSE),
    allow_unpaid_access = COALESCE(allow_unpaid_access, FALSE)
WHERE is_access_suspended IS NULL
   OR allow_unpaid_access IS NULL;


