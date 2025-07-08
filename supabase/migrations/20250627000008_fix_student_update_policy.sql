-- Fix student update policy and add debugging for learning_mode updates
-- This migration ensures students can update their own data properly

-- Drop and recreate the student update policy to ensure it works correctly
DROP POLICY IF EXISTS "Students can update own data" ON public.students;

CREATE POLICY "Students can update own data" ON public.students
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add a function to log student updates for debugging
CREATE OR REPLACE FUNCTION log_student_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the update for debugging
  RAISE NOTICE 'Student update: id=%, user_id=%, learning_mode=% -> %', 
    NEW.id, NEW.user_id, OLD.learning_mode, NEW.learning_mode;
  RETURN NEW;
END;
$$;

-- Create trigger to log student updates
DROP TRIGGER IF EXISTS trigger_log_student_update ON public.students;
CREATE TRIGGER trigger_log_student_update
  AFTER UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION log_student_update();

-- Ensure learning_mode column has proper constraints
ALTER TABLE public.students 
  ALTER COLUMN learning_mode SET DEFAULT 'in-person',
  ADD CONSTRAINT check_learning_mode 
    CHECK (learning_mode IN ('in-person', 'home', 'online'));

-- Add comment for clarity
COMMENT ON COLUMN public.students.learning_mode IS 'Learning mode: in-person, home, online'; 