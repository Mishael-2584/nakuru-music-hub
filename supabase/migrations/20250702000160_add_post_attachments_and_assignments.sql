-- Add file attachments to classroom posts
CREATE TABLE IF NOT EXISTS classroom_post_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES classroom_posts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add assignment grading fields to classroom posts
ALTER TABLE classroom_posts 
ADD COLUMN IF NOT EXISTS is_assignment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS assignment_title TEXT,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS max_points INTEGER;

-- Create table for assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES classroom_posts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submission_text TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  grade_points INTEGER,
  grade_feedback TEXT,
  graded_by UUID REFERENCES teachers(id),
  graded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(post_id, student_id)
);

-- Create table for submission attachments
CREATE TABLE IF NOT EXISTS submission_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE classroom_post_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_attachments ENABLE ROW LEVEL SECURITY;

-- Policy for viewing post attachments (enrolled students and teachers)
CREATE POLICY "Users can view post attachments in enrolled classrooms" ON classroom_post_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classroom_posts cp
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      WHERE cp.id = classroom_post_attachments.post_id
      AND (
        (ce.student_id IN (SELECT id FROM students WHERE user_id = auth.uid()))
        OR 
        (cp.author_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()))
      )
    )
  );

-- Policy for inserting post attachments (teachers only)
CREATE POLICY "Teachers can insert post attachments" ON classroom_post_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM classroom_posts cp
      WHERE cp.id = classroom_post_attachments.post_id
      AND cp.author_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    )
  );

-- Policy for viewing submissions (teachers and submitting student)
CREATE POLICY "Users can view submissions in their classrooms" ON assignment_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classroom_posts cp
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      WHERE cp.id = assignment_submissions.post_id
      AND (
        (assignment_submissions.student_id IN (SELECT id FROM students WHERE user_id = auth.uid()))
        OR 
        (cp.author_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()))
      )
    )
  );

-- Policy for inserting submissions (enrolled students only)
CREATE POLICY "Enrolled students can submit assignments" ON assignment_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM classroom_posts cp
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      WHERE cp.id = assignment_submissions.post_id
      AND assignment_submissions.student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    )
  );

-- Policy for updating submissions (teachers for grading, students for editing before due date)
CREATE POLICY "Users can update submissions appropriately" ON assignment_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM classroom_posts cp
      WHERE cp.id = assignment_submissions.post_id
      AND (
        (cp.author_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()))
        OR 
        (assignment_submissions.student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
         AND cp.due_date > NOW())
      )
    )
  );

-- Policy for viewing submission attachments
CREATE POLICY "Users can view submission attachments" ON submission_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignment_submissions s
      JOIN classroom_posts cp ON s.post_id = cp.id
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      WHERE s.id = submission_attachments.submission_id
      AND (
        (s.student_id IN (SELECT id FROM students WHERE user_id = auth.uid()))
        OR 
        (cp.author_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()))
      )
    )
  );

-- Policy for inserting submission attachments
CREATE POLICY "Students can insert submission attachments" ON submission_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignment_submissions s
      JOIN classroom_posts cp ON s.post_id = cp.id
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      WHERE s.id = submission_attachments.submission_id
      AND s.student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    )
  );
