// Quiz System Type Definitions

export interface Quiz {
  id: string;
  post_id: string;
  title: string;
  description?: string;
  time_limit_minutes?: number;
  show_answers_after: boolean;
  show_marks_immediately: boolean;
  passing_score: number;
  max_attempts: number;
  scheduled_open_at?: string;
  status: 'draft' | 'published' | 'closed';
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'matching';
  points: number;
  order_index: number;
  has_image_attachment: boolean;
  image_url?: string;
  image_filename?: string;
  created_at: string;
}

export interface QuizAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
}

export interface QuizMatchingPair {
  id: string;
  question_id: string;
  left_item: string;
  right_item: string;
  order_index: number;
  created_at: string;
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  student_id: string;
  attempt_number: number;
  started_at: string;
  submitted_at?: string;
  time_taken_minutes?: number;
  total_score: number;
  percentage_score: number;
  is_passed: boolean;
  status: 'in_progress' | 'submitted' | 'graded';
  created_at: string;
  updated_at: string;
}

export interface QuizSubmissionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  selected_answer_id?: string;
  matching_pairs: Array<{left: string; right: string}>;
  is_correct: boolean;
  points_earned: number;
  created_at: string;
}

// Form data interfaces for creating quizzes
export interface QuizFormData {
  title: string;
  description?: string;
  time_limit_minutes?: number;
  show_answers_after: boolean;
  show_marks_immediately: boolean;
  passing_score: number;
  max_attempts: number;
  scheduled_open_at?: string;
  status: 'draft' | 'published' | 'closed';
  is_draft: boolean;
  questions: QuizQuestionFormData[];
}

export interface QuizQuestionFormData {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'matching';
  points: number;
  order_index: number;
  has_image_attachment: boolean;
  image_url?: string;
  image_filename?: string;
  answers: QuizAnswerFormData[];
  matching_pairs: QuizMatchingPairFormData[];
}

export interface QuizAnswerFormData {
  id?: string;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuizMatchingPairFormData {
  id?: string;
  left_item: string;
  right_item: string;
  order_index: number;
}

// Student answer interfaces
export interface StudentQuizAnswer {
  question_id: string;
  selected_answer_id?: string;
  matching_pairs: Array<{left: string; right: string}>;
  image_attachment?: string;
  image_filename?: string;
}

export interface QuizResult {
  submission: QuizSubmission;
  answers: QuizSubmissionAnswer[];
  questions: QuizQuestion[];
  showAnswers: boolean;
}
