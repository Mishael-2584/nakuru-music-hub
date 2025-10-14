-- Performance indexes to reduce Disk IO on common query paths
-- Date: 2025-10-14

-- Classroom feed and assignment lookups
CREATE INDEX IF NOT EXISTS idx_classroom_posts_classroom_created_at
  ON public.classroom_posts(classroom_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classroom_posts_author
  ON public.classroom_posts(author_teacher_id);
CREATE INDEX IF NOT EXISTS idx_classroom_posts_is_assignment
  ON public.classroom_posts(is_assignment);

-- Attachments by post
CREATE INDEX IF NOT EXISTS idx_classroom_post_attachments_post_id
  ON public.classroom_post_attachments(post_id);

-- Enrollment lookups
CREATE INDEX IF NOT EXISTS idx_classroom_enrollments_classroom
  ON public.classroom_enrollments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_enrollments_student
  ON public.classroom_enrollments(student_id);

-- Teacher/student lookups by user_id
CREATE INDEX IF NOT EXISTS idx_teachers_user_id
  ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id
  ON public.students(user_id);

-- Quiz lookups
CREATE INDEX IF NOT EXISTS idx_quizzes_post_id
  ON public.quizzes(post_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id
  ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id
  ON public.quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_student
  ON public.quiz_submissions(quiz_id, student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submission_answers_submission
  ON public.quiz_submission_answers(submission_id);


