-- Language program: remote-only, monthly USD billing, pathway & package options

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS language_pathway TEXT,
  ADD COLUMN IF NOT EXISTS language_package TEXT;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS language_pathway TEXT,
  ADD COLUMN IF NOT EXISTS language_package TEXT;

COMMENT ON COLUMN public.registrations.language_pathway IS 'conversational | academic when course_category is Languages';
COMMENT ON COLUMN public.registrations.language_package IS 'individual | family_group when course_category is Languages';
COMMENT ON COLUMN public.students.language_pathway IS 'conversational | academic when course_category is Languages';
COMMENT ON COLUMN public.students.language_package IS 'individual | family_group when course_category is Languages';

-- Retire legacy per-session KES language fees
UPDATE public.fees
SET is_active = false
WHERE course_type = 'languages';

-- Monthly USD fees (full month amount; sessions_per_week distinguishes plans)
INSERT INTO public.fees (
  course_type, course_name, price, duration, description, level,
  payment_frequency, mode, sessions_per_week, hours_per_session, currency, payment_type, is_active
)
SELECT v.course_type, v.course_name, v.price, v.duration, v.description, v.level,
       v.payment_frequency, v.mode, v.sessions_per_week, v.hours_per_session, v.currency, v.payment_type, v.is_active
FROM (VALUES
  ('languages', 'Language Lessons - Individual', 80.00, '1 month', 'Individual — 1 session/week ($20 × 4)', 'All Levels', 'monthly', 'Online (Global)', 1, 1.0, '$', 'monthly', true),
  ('languages', 'Language Lessons - Individual', 120.00, '1 month', 'Individual — 2 sessions/week ($15 × 8)', 'All Levels', 'monthly', 'Online (Global)', 2, 1.0, '$', 'monthly', true),
  ('languages', 'Language Lessons - Family/Group', 120.00, '1 month', 'Family/Group (up to 3) — 1 shared session/week ($30 × 4)', 'All Levels', 'monthly', 'Online (Global)', 1, 1.0, '$', 'monthly', true),
  ('languages', 'Language Lessons - Family/Group', 176.00, '1 month', 'Family/Group (up to 3) — 2 shared sessions/week ($22 × 8)', 'All Levels', 'monthly', 'Online (Global)', 2, 1.0, '$', 'monthly', true)
) AS v(course_type, course_name, price, duration, description, level, payment_frequency, mode, sessions_per_week, hours_per_session, currency, payment_type, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.fees f
  WHERE f.course_type = v.course_type
    AND f.course_name = v.course_name
    AND f.payment_type = v.payment_type
    AND f.mode = v.mode
    AND f.sessions_per_week = v.sessions_per_week
    AND f.is_active = true
);

CREATE OR REPLACE FUNCTION create_student_from_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mapped_learning_mode TEXT;
BEGIN
  mapped_learning_mode := CASE
    WHEN NEW.course_category = 'Languages' THEN 'online'
    WHEN NEW.learning_mode IN ('in-person', 'home', 'online') THEN NEW.learning_mode
    WHEN NEW.learning_mode IN ('home-lessons', 'home (nakuru & environs)') THEN 'home'
    ELSE 'in-person'
  END;

  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.students (
      registration_id,
      student_name,
      age,
      email,
      phone,
      country_code,
      parent_name,
      parent_phone,
      instrument,
      experience,
      proficiency_level,
      learning_mode,
      owns_instrument,
      location,
      medical_condition,
      medical_details,
      goals,
      preferred_schedule,
      date_of_birth,
      sessions_per_week,
      course_category,
      production_type,
      technology_type,
      language_type,
      language_pathway,
      language_package
    ) VALUES (
      NEW.id,
      NEW.student_name,
      NEW.age,
      NEW.email,
      COALESCE(NEW.phone, ''),
      COALESCE(NEW.country_code, '+254'),
      NEW.parent_name,
      NEW.parent_phone,
      COALESCE(NULLIF(TRIM(NEW.instrument), ''),
        CASE
          WHEN NEW.course_category = 'Production' THEN COALESCE(NEW.production_type, 'Production')
          WHEN NEW.course_category = 'Technology' THEN COALESCE(NEW.technology_type, 'Technology')
          WHEN NEW.course_category = 'Languages' THEN COALESCE(NEW.language_type, 'Language Lessons')
          WHEN NEW.course_category = 'Art' THEN 'Art Classes'
          ELSE 'Piano'
        END),
      COALESCE(NEW.experience, 'beginner'),
      COALESCE(NEW.proficiency_level, 'beginner'),
      mapped_learning_mode,
      COALESCE(NEW.owns_instrument, false),
      NEW.location,
      COALESCE(NEW.medical_condition, 'no'),
      NEW.medical_details,
      NEW.goals,
      NEW.preferred_schedule,
      NEW.date_of_birth,
      COALESCE(NEW.sessions_per_week, 1),
      NEW.course_category,
      NEW.production_type,
      NEW.technology_type,
      NEW.language_type,
      NEW.language_pathway,
      NEW.language_package
    )
    ON CONFLICT (email) DO UPDATE SET
      registration_id = EXCLUDED.registration_id,
      student_name = EXCLUDED.student_name,
      age = EXCLUDED.age,
      phone = EXCLUDED.phone,
      country_code = EXCLUDED.country_code,
      parent_name = EXCLUDED.parent_name,
      parent_phone = EXCLUDED.parent_phone,
      instrument = EXCLUDED.instrument,
      experience = EXCLUDED.experience,
      proficiency_level = EXCLUDED.proficiency_level,
      learning_mode = EXCLUDED.learning_mode,
      owns_instrument = EXCLUDED.owns_instrument,
      location = EXCLUDED.location,
      medical_condition = EXCLUDED.medical_condition,
      medical_details = EXCLUDED.medical_details,
      goals = EXCLUDED.goals,
      preferred_schedule = EXCLUDED.preferred_schedule,
      date_of_birth = EXCLUDED.date_of_birth,
      sessions_per_week = EXCLUDED.sessions_per_week,
      course_category = EXCLUDED.course_category,
      production_type = EXCLUDED.production_type,
      technology_type = EXCLUDED.technology_type,
      language_type = EXCLUDED.language_type,
      language_pathway = EXCLUDED.language_pathway,
      language_package = EXCLUDED.language_package,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;
