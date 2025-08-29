-- Create table for assignment submission files

CREATE TABLE IF NOT EXISTS assignment_submission_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignment_submission_files_submission_id ON assignment_submission_files(submission_id);

-- Enable RLS
ALTER TABLE assignment_submission_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Students can view their own submission files" ON assignment_submission_files
  FOR SELECT USING (
    submission_id IN (
      SELECT id FROM assignment_submissions 
      WHERE student_id = (
        SELECT id FROM students WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers can view submission files for their classrooms" ON assignment_submission_files
  FOR SELECT USING (
    submission_id IN (
      SELECT asub.id FROM assignment_submissions asub
      JOIN classroom_posts cp ON asub.post_id = cp.id
      JOIN classrooms c ON cp.classroom_id = c.id
      WHERE c.teacher_id = (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Students can insert their own submission files" ON assignment_submission_files
  FOR INSERT WITH CHECK (
    submission_id IN (
      SELECT id FROM assignment_submissions 
      WHERE student_id = (
        SELECT id FROM students WHERE user_id = auth.uid()
      )
    )
  );
