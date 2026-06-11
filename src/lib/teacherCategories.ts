/** Teacher signup categories and subjects — stored in pending_teachers / teachers tables. */
export const TEACHER_CATEGORY_SUBJECTS = {
  Music: [
    'Piano',
    'Drums',
    'Violin',
    'Saxophone',
    'Bass Guitar',
    'Acoustic Guitar',
    'Electric Guitar',
    'Flute',
    'Clarinet',
    'Cello',
    'Voice',
    'Music Theory',
    'Trumpet',
    'Trombone',
    'Kiswahili',
    'Other',
  ],
  Production: ['Music Production', 'Live Sound', 'Videography', 'Kiswahili', 'Other'],
  Art: ['Drawing', 'Painting', 'Sculpture', 'Digital Art', 'Kiswahili', 'Other'],
  Other: ['Kiswahili', 'English', 'Mathematics', 'General Studies', 'Other'],
} as const;

export type TeacherCategory = keyof typeof TEACHER_CATEGORY_SUBJECTS;

export const TEACHER_CATEGORIES = Object.keys(
  TEACHER_CATEGORY_SUBJECTS
) as TeacherCategory[];
