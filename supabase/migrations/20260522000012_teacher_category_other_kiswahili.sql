-- Document teacher category/subject options (no enum — free text + text[] for flexibility)

COMMENT ON COLUMN public.pending_teachers.category IS
  'Teaching category: Music, Production, Art, Other (and any future academy categories)';

COMMENT ON COLUMN public.pending_teachers.subjects IS
  'Subjects/disciplines taught, e.g. Piano, Kiswahili, Web Design, Other';

COMMENT ON COLUMN public.teachers.category IS
  'Teaching category: Music, Production, Art, Other (and any future academy categories)';

COMMENT ON COLUMN public.teachers.subjects IS
  'Subjects/disciplines taught, e.g. Piano, Kiswahili, Web Design, Other';
