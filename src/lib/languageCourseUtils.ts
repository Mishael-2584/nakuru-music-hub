/** Language courses — per-session billing at KES 1,500 */

export const LANGUAGE_OPTIONS = [
  'English',
  'Kiswahili',
  'Luganda',
  'Kinyarwanda',
  'French',
  'German',
  'Other',
] as const;

export type LanguageOption = (typeof LANGUAGE_OPTIONS)[number];

export const LANGUAGE_FEE_COURSE_NAME = 'Language Lessons';
export const LANGUAGE_SESSION_PRICE_KES = 1500;

export function isLanguagesCategory(category?: string | null): boolean {
  return String(category || '').toLowerCase() === 'languages';
}

export function getLanguageDisplayName(
  languageType?: string | null,
  customLanguage?: string | null
): string {
  const raw = String(languageType || '').trim();
  if (!raw) return 'Language Lessons';
  if (raw === 'Other' && customLanguage?.trim()) return customLanguage.trim();
  return raw;
}

export function getLanguageFeeCourseName(): string {
  return LANGUAGE_FEE_COURSE_NAME;
}
