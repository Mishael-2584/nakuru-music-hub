-- Languages course category: per-session billing at KES 1,500

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS language_type TEXT;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS language_type TEXT;

COMMENT ON COLUMN public.registrations.language_type IS 'Language studied when course_category is Languages (e.g. English, Kiswahili)';
COMMENT ON COLUMN public.students.language_type IS 'Language studied when course_category is Languages';

-- Ensure fees columns exist (prod schema uses payment_frequency, not billing_period)
ALTER TABLE public.fees
  ADD COLUMN IF NOT EXISTS level text DEFAULT 'All Levels',
  ADD COLUMN IF NOT EXISTS payment_frequency text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS mode TEXT,
  ADD COLUMN IF NOT EXISTS sessions_per_week INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS hours_per_session DECIMAL(3,1) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KSh',
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'per_class';

-- Per-session language fees (KES 1,500 / session)
-- Column list matches 20250122000000_add_technology_courses.sql (payment_frequency, not billing_period).
INSERT INTO public.fees (
  course_type, course_name, price, duration, description, level,
  payment_frequency, mode, sessions_per_week, hours_per_session, currency, payment_type, is_active
)
SELECT v.course_type, v.course_name, v.price, v.duration, v.description, v.level,
       v.payment_frequency, v.mode, v.sessions_per_week, v.hours_per_session, v.currency, v.payment_type, v.is_active
FROM (VALUES
  ('languages', 'Language Lessons', 1500.00, '1 hour', '1-on-1 language class at the academy', 'All Levels', 'per_class', 'At the Academy', 1, 1.0, 'KSh', 'per_class', true),
  ('languages', 'Language Lessons', 1500.00, '1 hour', '1-on-1 language class online', 'All Levels', 'per_class', 'Online (Global)', 1, 1.0, 'KSh', 'per_class', true)
) AS v(course_type, course_name, price, duration, description, level, payment_frequency, mode, sessions_per_week, hours_per_session, currency, payment_type, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.fees f
  WHERE f.course_type = v.course_type
    AND f.course_name = v.course_name
    AND f.payment_type = v.payment_type
    AND f.mode = v.mode
    AND f.is_active = true
);

-- Student creation on registration approval
CREATE OR REPLACE FUNCTION create_student_from_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mapped_learning_mode TEXT;
BEGIN
  mapped_learning_mode := CASE
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
      language_type
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
      NEW.language_type
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
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;
