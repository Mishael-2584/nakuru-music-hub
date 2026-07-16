-- Quiz attempt lifecycle + timing enforcement + stop leaking correct answers to students

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_quiz_teacher(quiz_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM quizzes q
    JOIN classroom_posts cp ON q.post_id = cp.id
    JOIN classrooms c ON cp.classroom_id = c.id
    JOIN teachers t ON c.teacher_id = t.id
    WHERE q.id = quiz_id_param
      AND t.user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_quiz_teacher(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Student-safe quiz load: hide is_correct; scramble matching right options
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS get_quiz_by_post_id(UUID);

CREATE OR REPLACE FUNCTION get_quiz_by_post_id(post_id_param UUID)
RETURNS TABLE (
  quiz_id UUID,
  quiz_title TEXT,
  quiz_description TEXT,
  time_limit_minutes INTEGER,
  show_answers_after BOOLEAN,
  show_marks_immediately BOOLEAN,
  passing_score INTEGER,
  max_attempts INTEGER,
  scheduled_open_at TIMESTAMPTZ,
  question_id UUID,
  question_text TEXT,
  question_type TEXT,
  question_points INTEGER,
  question_order INTEGER,
  has_image_attachment BOOLEAN,
  image_url TEXT,
  image_filename TEXT,
  answer_id UUID,
  answer_text TEXT,
  answer_is_correct BOOLEAN,
  answer_order INTEGER,
  matching_left TEXT,
  matching_right TEXT,
  matching_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz_id UUID;
  v_is_teacher BOOLEAN := FALSE;
BEGIN
  SELECT q.id INTO v_quiz_id FROM quizzes q WHERE q.post_id = post_id_param LIMIT 1;
  IF v_quiz_id IS NULL THEN
    RETURN;
  END IF;

  v_is_teacher := public.is_quiz_teacher(v_quiz_id);

  RETURN QUERY
  WITH quiz_meta AS (
    SELECT
      q.id AS q_quiz_id,
      q.title AS q_title,
      q.description AS q_description,
      q.time_limit_minutes AS q_time_limit,
      q.show_answers_after AS q_show_answers,
      q.show_marks_immediately AS q_show_marks,
      q.passing_score AS q_passing,
      q.max_attempts AS q_max_attempts,
      q.scheduled_open_at AS q_scheduled_open_at
    FROM quizzes q
    WHERE q.post_id = post_id_param
  ),
  questions AS (
    SELECT
      qq.id AS qq_id,
      qq.quiz_id,
      qq.question_text AS qq_text,
      qq.question_type AS qq_type,
      qq.points AS qq_points,
      qq.order_index AS qq_order,
      COALESCE(qq.has_image_attachment, false) AS qq_has_image,
      qq.image_url AS qq_image_url,
      qq.image_filename AS qq_image_filename
    FROM quiz_questions qq
    JOIN quiz_meta qm ON qm.q_quiz_id = qq.quiz_id
  ),
  answer_rows AS (
    SELECT
      qm.q_quiz_id,
      qm.q_title,
      qm.q_description,
      qm.q_time_limit,
      qm.q_show_answers,
      qm.q_show_marks,
      qm.q_passing,
      qm.q_max_attempts,
      qm.q_scheduled_open_at,
      qs.qq_id,
      qs.qq_text,
      qs.qq_type,
      qs.qq_points,
      qs.qq_order,
      qs.qq_has_image,
      qs.qq_image_url,
      qs.qq_image_filename,
      qa.id AS qa_id,
      qa.answer_text AS qa_text,
      CASE WHEN v_is_teacher THEN qa.is_correct ELSE FALSE END AS qa_is_correct,
      qa.order_index AS qa_order,
      NULL::TEXT AS matching_left,
      NULL::TEXT AS matching_right,
      NULL::INTEGER AS matching_order
    FROM questions qs
    JOIN quiz_meta qm ON TRUE
    JOIN quiz_answers qa ON qa.question_id = qs.qq_id
  ),
  matching_base AS (
    SELECT
      qmp.id,
      qmp.question_id,
      qmp.left_item,
      qmp.right_item,
      qmp.order_index,
      row_number() OVER (
        PARTITION BY qmp.question_id
        ORDER BY qmp.order_index, qmp.id
      ) AS left_rn
    FROM quiz_matching_pairs qmp
    JOIN questions qs ON qs.qq_id = qmp.question_id
  ),
  matching_rights AS (
    SELECT
      mb.question_id,
      mb.right_item,
      row_number() OVER (
        PARTITION BY mb.question_id
        ORDER BY
          CASE WHEN v_is_teacher THEN mb.order_index END NULLS LAST,
          CASE WHEN v_is_teacher THEN mb.id::text ELSE md5(mb.id::text || mb.question_id::text) END
      ) AS right_rn
    FROM matching_base mb
  ),
  matching_rows AS (
    SELECT
      qm.q_quiz_id,
      qm.q_title,
      qm.q_description,
      qm.q_time_limit,
      qm.q_show_answers,
      qm.q_show_marks,
      qm.q_passing,
      qm.q_max_attempts,
      qm.q_scheduled_open_at,
      qs.qq_id,
      qs.qq_text,
      qs.qq_type,
      qs.qq_points,
      qs.qq_order,
      qs.qq_has_image,
      qs.qq_image_url,
      qs.qq_image_filename,
      NULL::UUID AS qa_id,
      NULL::TEXT AS qa_text,
      FALSE AS qa_is_correct,
      NULL::INTEGER AS qa_order,
      mb.left_item AS matching_left,
      mr.right_item AS matching_right,
      mb.order_index AS matching_order
    FROM matching_base mb
    JOIN matching_rights mr
      ON mr.question_id = mb.question_id
     AND mr.right_rn = mb.left_rn
    JOIN questions qs ON qs.qq_id = mb.question_id
    JOIN quiz_meta qm ON TRUE
  ),
  question_only AS (
    SELECT
      qm.q_quiz_id,
      qm.q_title,
      qm.q_description,
      qm.q_time_limit,
      qm.q_show_answers,
      qm.q_show_marks,
      qm.q_passing,
      qm.q_max_attempts,
      qm.q_scheduled_open_at,
      qs.qq_id,
      qs.qq_text,
      qs.qq_type,
      qs.qq_points,
      qs.qq_order,
      qs.qq_has_image,
      qs.qq_image_url,
      qs.qq_image_filename,
      NULL::UUID AS qa_id,
      NULL::TEXT AS qa_text,
      FALSE AS qa_is_correct,
      NULL::INTEGER AS qa_order,
      NULL::TEXT AS matching_left,
      NULL::TEXT AS matching_right,
      NULL::INTEGER AS matching_order
    FROM questions qs
    JOIN quiz_meta qm ON TRUE
    WHERE NOT EXISTS (SELECT 1 FROM quiz_answers qa WHERE qa.question_id = qs.qq_id)
      AND NOT EXISTS (SELECT 1 FROM quiz_matching_pairs qmp WHERE qmp.question_id = qs.qq_id)
  )
  SELECT * FROM (
    SELECT * FROM answer_rows
    UNION ALL
    SELECT * FROM matching_rows
    UNION ALL
    SELECT * FROM question_only
  ) combined
  ORDER BY qq_order NULLS LAST, qa_order NULLS LAST, matching_order NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION get_quiz_by_post_id(UUID) TO authenticated;

-- Hide correctness from generic answers helper for non-teachers
CREATE OR REPLACE FUNCTION public.get_answers_for_questions(question_ids_param UUID[])
RETURNS TABLE (
  id UUID,
  question_id UUID,
  answer_text TEXT,
  is_correct BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qa.id,
    qa.question_id,
    qa.answer_text,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM quiz_questions qq
        WHERE qq.id = qa.question_id
          AND public.is_quiz_teacher(qq.quiz_id)
      ) THEN qa.is_correct
      ELSE FALSE
    END AS is_correct
  FROM public.quiz_answers qa
  WHERE qa.question_id = ANY(question_ids_param);
END;
$$;

-- ---------------------------------------------------------------------------
-- Existing submission check: only finished attempts (not in_progress)
-- Must DROP first — return type changed (cannot CREATE OR REPLACE).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS check_existing_quiz_submission(UUID, UUID);

CREATE FUNCTION check_existing_quiz_submission(
  quiz_id_param UUID,
  student_id_param UUID
)
RETURNS TABLE (
  id UUID,
  quiz_id UUID,
  student_id UUID,
  attempt_number INTEGER,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  status TEXT,
  total_score INTEGER,
  percentage_score DECIMAL,
  is_passed BOOLEAN,
  time_taken_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qs.id,
    qs.quiz_id,
    qs.student_id,
    qs.attempt_number,
    qs.started_at,
    qs.submitted_at,
    qs.status,
    qs.total_score,
    qs.percentage_score,
    qs.is_passed,
    qs.time_taken_minutes
  FROM quiz_submissions qs
  WHERE qs.quiz_id = quiz_id_param
    AND qs.student_id = student_id_param
    AND qs.status IN ('submitted', 'graded')
  ORDER BY qs.submitted_at DESC NULLS LAST
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION check_existing_quiz_submission(UUID, UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Start / resume timed attempt
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_quiz_attempt(
  quiz_id_param UUID,
  student_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz RECORD;
  v_active RECORD;
  v_finished_count INTEGER;
  v_next_attempt INTEGER;
  v_new_id UUID;
  v_elapsed_seconds INTEGER;
  v_limit_seconds INTEGER;
  v_remaining INTEGER;
  v_grace_seconds CONSTANT INTEGER := 60;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> student_id_param THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;

  SELECT * INTO v_quiz FROM quizzes WHERE id = quiz_id_param;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Quiz not found');
  END IF;

  IF COALESCE(v_quiz.is_draft, FALSE) OR COALESCE(v_quiz.status, 'published') = 'draft' THEN
    RETURN jsonb_build_object('error', 'Quiz is not available yet');
  END IF;

  IF v_quiz.scheduled_open_at IS NOT NULL AND v_quiz.scheduled_open_at > NOW() THEN
    RETURN jsonb_build_object(
      'error', 'Quiz is not open yet',
      'scheduled_open_at', v_quiz.scheduled_open_at
    );
  END IF;

  SELECT * INTO v_active
  FROM quiz_submissions
  WHERE quiz_id = quiz_id_param
    AND student_id = student_id_param
    AND status = 'in_progress'
  ORDER BY started_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_elapsed_seconds := GREATEST(0, EXTRACT(EPOCH FROM (NOW() - v_active.started_at))::INTEGER);
    v_limit_seconds := COALESCE(v_quiz.time_limit_minutes, 0) * 60;
    IF v_limit_seconds > 0 THEN
      v_remaining := GREATEST(0, v_limit_seconds - v_elapsed_seconds);
    ELSE
      v_remaining := NULL;
    END IF;

    RETURN jsonb_build_object(
      'submission_id', v_active.id,
      'attempt_number', v_active.attempt_number,
      'started_at', v_active.started_at,
      'status', v_active.status,
      'time_limit_minutes', v_quiz.time_limit_minutes,
      'seconds_remaining', v_remaining,
      'elapsed_seconds', v_elapsed_seconds,
      'timed_out', (v_limit_seconds > 0 AND v_elapsed_seconds > (v_limit_seconds + v_grace_seconds)),
      'already_started', TRUE
    );
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_finished_count
  FROM quiz_submissions
  WHERE quiz_id = quiz_id_param
    AND student_id = student_id_param
    AND status IN ('submitted', 'graded');

  IF v_finished_count >= COALESCE(v_quiz.max_attempts, 1) THEN
    RETURN jsonb_build_object('error', 'Maximum attempts reached');
  END IF;

  v_next_attempt := v_finished_count + 1;

  INSERT INTO quiz_submissions (
    quiz_id,
    student_id,
    attempt_number,
    started_at,
    status
  ) VALUES (
    quiz_id_param,
    student_id_param,
    v_next_attempt,
    NOW(),
    'in_progress'
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'submission_id', v_new_id,
    'attempt_number', v_next_attempt,
    'started_at', NOW(),
    'status', 'in_progress',
    'time_limit_minutes', v_quiz.time_limit_minutes,
    'seconds_remaining', CASE
      WHEN v_quiz.time_limit_minutes IS NULL THEN NULL
      ELSE v_quiz.time_limit_minutes * 60
    END,
    'elapsed_seconds', 0,
    'timed_out', FALSE,
    'already_started', FALSE
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_quiz_attempt(UUID, UUID) TO authenticated;

-- Read-only: resume info without creating a new attempt
CREATE OR REPLACE FUNCTION public.get_active_quiz_attempt(
  quiz_id_param UUID,
  student_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz RECORD;
  v_active RECORD;
  v_elapsed_seconds INTEGER;
  v_limit_seconds INTEGER;
  v_remaining INTEGER;
  v_grace_seconds CONSTANT INTEGER := 60;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> student_id_param THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;

  SELECT * INTO v_quiz FROM quizzes WHERE id = quiz_id_param;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('active', FALSE);
  END IF;

  SELECT * INTO v_active
  FROM quiz_submissions
  WHERE quiz_id = quiz_id_param
    AND student_id = student_id_param
    AND status = 'in_progress'
  ORDER BY started_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('active', FALSE);
  END IF;

  v_elapsed_seconds := GREATEST(0, EXTRACT(EPOCH FROM (NOW() - v_active.started_at))::INTEGER);
  v_limit_seconds := COALESCE(v_quiz.time_limit_minutes, 0) * 60;
  IF v_limit_seconds > 0 THEN
    v_remaining := GREATEST(0, v_limit_seconds - v_elapsed_seconds);
  ELSE
    v_remaining := NULL;
  END IF;

  RETURN jsonb_build_object(
    'active', TRUE,
    'submission_id', v_active.id,
    'attempt_number', v_active.attempt_number,
    'started_at', v_active.started_at,
    'status', v_active.status,
    'time_limit_minutes', v_quiz.time_limit_minutes,
    'seconds_remaining', v_remaining,
    'elapsed_seconds', v_elapsed_seconds,
    'timed_out', (v_limit_seconds > 0 AND v_elapsed_seconds > (v_limit_seconds + v_grace_seconds)),
    'already_started', TRUE
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_quiz_attempt(UUID, UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Submit with time / attempt enforcement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION submit_quiz_complete(
  quiz_id_param UUID,
  student_id_param UUID,
  answers_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_submission_id UUID;
  calculated_score INTEGER := 0;
  calculated_points INTEGER := 0;
  calculated_percentage DECIMAL(5,2);
  passed BOOLEAN;
  quiz_record RECORD;
  answer_data JSONB;
  question_record RECORD;
  correct_answer_count INTEGER := 0;
  total_questions INTEGER := 0;
  is_correct_answer BOOLEAN;
  answer_points INTEGER;
  selected_ans_id UUID;
  correct_ans_check BOOLEAN;
  question_pts INTEGER;
  v_active RECORD;
  v_elapsed_seconds INTEGER;
  v_limit_seconds INTEGER;
  v_grace_seconds CONSTANT INTEGER := 60;
  v_timed_out BOOLEAN := FALSE;
  v_force_empty BOOLEAN := FALSE;
  v_time_taken INTEGER;
  v_finished_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> student_id_param THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;

  SELECT * INTO quiz_record FROM quizzes WHERE id = quiz_id_param;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Quiz not found');
  END IF;

  IF quiz_record.scheduled_open_at IS NOT NULL AND quiz_record.scheduled_open_at > NOW() THEN
    RETURN jsonb_build_object('error', 'Quiz is not open yet');
  END IF;

  SELECT * INTO v_active
  FROM quiz_submissions
  WHERE quiz_id = quiz_id_param
    AND student_id = student_id_param
    AND status = 'in_progress'
  ORDER BY started_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    -- Auto-start then continue (covers edge cases)
    PERFORM public.start_quiz_attempt(quiz_id_param, student_id_param);
    SELECT * INTO v_active
    FROM quiz_submissions
    WHERE quiz_id = quiz_id_param
      AND student_id = student_id_param
      AND status = 'in_progress'
    ORDER BY started_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Could not start quiz attempt');
    END IF;
  END IF;

  new_submission_id := v_active.id;
  v_elapsed_seconds := GREATEST(0, EXTRACT(EPOCH FROM (NOW() - v_active.started_at))::INTEGER);
  v_limit_seconds := COALESCE(quiz_record.time_limit_minutes, 0) * 60;

  IF v_limit_seconds > 0 AND v_elapsed_seconds > (v_limit_seconds + v_grace_seconds) THEN
    v_timed_out := TRUE;
    v_force_empty := TRUE;
  ELSIF v_limit_seconds > 0 AND v_elapsed_seconds > v_limit_seconds THEN
    v_timed_out := TRUE;
  END IF;

  -- Clear any prior answer rows if re-submitting the same attempt
  DELETE FROM quiz_submission_answers WHERE submission_id = new_submission_id;

  IF NOT v_force_empty THEN
    FOR answer_data IN SELECT * FROM jsonb_array_elements(COALESCE(answers_data, '[]'::jsonb))
    LOOP
      SELECT * INTO question_record
      FROM quiz_questions
      WHERE id = (answer_data->>'question_id')::UUID
        AND quiz_id = quiz_id_param;

      IF FOUND THEN
        total_questions := total_questions + 1;
        is_correct_answer := FALSE;
        answer_points := 0;
        selected_ans_id := NULLIF(answer_data->>'selected_answer_id', '')::UUID;

        IF question_record.question_type IN ('multiple_choice', 'true_false') THEN
          SELECT qa.is_correct, question_record.points
          INTO correct_ans_check, question_pts
          FROM quiz_answers qa
          WHERE qa.id = selected_ans_id
            AND qa.question_id = question_record.id;

          IF FOUND AND correct_ans_check THEN
            is_correct_answer := TRUE;
            answer_points := question_pts;
          END IF;
        ELSIF question_record.question_type = 'matching' THEN
          DECLARE
            submitted_matching_pairs JSONB := answer_data->'matching_pairs';
            all_correct BOOLEAN := TRUE;
            total_pair_count INTEGER := 0;
            expected_pair_count INTEGER := 0;
          BEGIN
            SELECT COUNT(*)::INTEGER INTO expected_pair_count
            FROM quiz_matching_pairs
            WHERE question_id = question_record.id;

            IF submitted_matching_pairs IS NOT NULL AND jsonb_array_length(submitted_matching_pairs) > 0 THEN
              total_pair_count := jsonb_array_length(submitted_matching_pairs);
              IF total_pair_count <> expected_pair_count THEN
                all_correct := FALSE;
              ELSE
                FOR i IN 0..total_pair_count - 1 LOOP
                  IF NOT EXISTS (
                    SELECT 1 FROM quiz_matching_pairs
                    WHERE question_id = question_record.id
                      AND left_item = submitted_matching_pairs->i->>'left'
                      AND right_item = submitted_matching_pairs->i->>'right'
                  ) THEN
                    all_correct := FALSE;
                    EXIT;
                  END IF;
                END LOOP;
              END IF;
            ELSE
              all_correct := FALSE;
            END IF;

            IF all_correct AND total_pair_count > 0 THEN
              is_correct_answer := TRUE;
              answer_points := question_record.points;
            END IF;
          END;
        END IF;

        INSERT INTO quiz_submission_answers (
          submission_id,
          question_id,
          selected_answer_id,
          matching_pairs,
          is_correct,
          points_earned
        ) VALUES (
          new_submission_id,
          question_record.id,
          selected_ans_id,
          COALESCE(answer_data->'matching_pairs', '[]'::jsonb),
          is_correct_answer,
          answer_points
        );

        calculated_score := calculated_score + COALESCE(answer_points, 0);
        calculated_points := calculated_points + COALESCE(question_record.points, 0);
        IF is_correct_answer THEN
          correct_answer_count := correct_answer_count + 1;
        END IF;
      END IF;
    END LOOP;
  ELSE
    -- Hard timeout: score zero for all questions
    SELECT COALESCE(SUM(points), 0)::INTEGER INTO calculated_points
    FROM quiz_questions
    WHERE quiz_id = quiz_id_param;

    SELECT COUNT(*)::INTEGER INTO total_questions
    FROM quiz_questions
    WHERE quiz_id = quiz_id_param;
  END IF;

  IF calculated_points > 0 THEN
    calculated_percentage := ROUND((calculated_score::DECIMAL / calculated_points::DECIMAL) * 100, 2);
  ELSE
    calculated_percentage := 0;
  END IF;

  passed := calculated_percentage >= COALESCE(quiz_record.passing_score, 60);
  v_time_taken := GREATEST(1, CEIL(v_elapsed_seconds / 60.0)::INTEGER);

  UPDATE quiz_submissions
  SET
    submitted_at = NOW(),
    status = 'submitted',
    total_score = calculated_score,
    percentage_score = calculated_percentage,
    is_passed = passed,
    time_taken_minutes = v_time_taken,
    updated_at = NOW()
  WHERE id = new_submission_id;

  RETURN jsonb_build_object(
    'submission_id', new_submission_id,
    'score', calculated_score,
    'total_points', calculated_points,
    'percentage', calculated_percentage,
    'passed', passed,
    'correct_answers', correct_answer_count,
    'total_questions', total_questions,
    'attempt_number', v_active.attempt_number,
    'timed_out', v_timed_out,
    'time_taken_minutes', v_time_taken
  );
END;
$$;

GRANT EXECUTE ON FUNCTION submit_quiz_complete(UUID, UUID, JSONB) TO authenticated;

COMMENT ON FUNCTION public.start_quiz_attempt(UUID, UUID) IS
  'Creates or resumes an in_progress quiz attempt and returns remaining seconds for timed quizzes.';
COMMENT ON FUNCTION submit_quiz_complete(UUID, UUID, JSONB) IS
  'Submits an in_progress quiz attempt with server-side time-limit enforcement.';
