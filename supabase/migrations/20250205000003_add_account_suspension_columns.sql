-- Add missing account suspension columns to students table
-- This migration adds the columns needed for account suspension/activation feature

-- Add account control columns to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS account_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS account_notes TEXT DEFAULT NULL;

-- Add indexes for account status queries
CREATE INDEX IF NOT EXISTS idx_students_account_suspended ON public.students(account_suspended);

-- Add comments for clarity
COMMENT ON COLUMN public.students.account_suspended IS 'Admin can manually suspend student account, blocking all access';
COMMENT ON COLUMN public.students.suspension_reason IS 'Reason provided by the admin when suspending access';
COMMENT ON COLUMN public.students.suspended_by IS 'User ID of the admin who suspended the account';
COMMENT ON COLUMN public.students.suspended_at IS 'Timestamp when the account was suspended';
COMMENT ON COLUMN public.students.account_notes IS 'Admin notes about account status, restrictions, or special arrangements';

-- Grant update permissions for account control columns
GRANT UPDATE (account_suspended, suspension_reason, suspended_by, suspended_at, account_notes) 
ON public.students TO authenticated;

-- Record this migration in the tracking table (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'supabase_migrations' 
    AND table_name = 'schema_migrations'
  ) THEN
    INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
    VALUES (
      '20250205000003',
      ARRAY[
        'ALTER TABLE public.students ADD COLUMN IF NOT EXISTS account_suspended BOOLEAN DEFAULT FALSE, ADD COLUMN IF NOT EXISTS suspension_reason TEXT DEFAULT NULL, ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id) DEFAULT NULL, ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, ADD COLUMN IF NOT EXISTS account_notes TEXT DEFAULT NULL;',
        'CREATE INDEX IF NOT EXISTS idx_students_account_suspended ON public.students(account_suspended);',
        'GRANT UPDATE (account_suspended, suspension_reason, suspended_by, suspended_at, account_notes) ON public.students TO authenticated;'
      ],
      'add_account_suspension_columns'
    )
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;

