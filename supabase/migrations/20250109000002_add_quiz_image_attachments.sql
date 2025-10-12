-- Add image attachment support to quiz questions
-- This migration adds fields for image attachments and scheduling

-- Add image attachment fields to quiz_questions table
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS has_image_attachment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_filename TEXT;

-- Add scheduling fields to quizzes table
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS scheduled_open_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed'));

-- Add draft functionality
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.quiz_questions.has_image_attachment IS 'Whether this question requires an image attachment from students';
COMMENT ON COLUMN public.quiz_questions.image_url IS 'URL of the image attached to this question (for teacher reference)';
COMMENT ON COLUMN public.quiz_questions.image_filename IS 'Original filename of the attached image';
COMMENT ON COLUMN public.quizzes.scheduled_open_at IS 'When the quiz should become available to students';
COMMENT ON COLUMN public.quizzes.status IS 'Current status of the quiz: draft, published, or closed';
COMMENT ON COLUMN public.quizzes.is_draft IS 'Whether the quiz is still in draft mode';

-- Add image attachment fields to quiz_submission_answers table
ALTER TABLE public.quiz_submission_answers
ADD COLUMN IF NOT EXISTS image_attachment TEXT,
ADD COLUMN IF NOT EXISTS image_filename TEXT;

-- Add comments for submission answers
COMMENT ON COLUMN public.quiz_submission_answers.image_attachment IS 'Base64 encoded image uploaded by student';
COMMENT ON COLUMN public.quiz_submission_answers.image_filename IS 'Original filename of the uploaded image';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_questions_image_attachment ON public.quiz_questions(has_image_attachment);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled_open ON public.quizzes(scheduled_open_at);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_draft ON public.quizzes(is_draft);
CREATE INDEX IF NOT EXISTS idx_quiz_submission_answers_image ON public.quiz_submission_answers(image_attachment);
