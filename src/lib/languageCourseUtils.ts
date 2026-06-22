/** Language program — fully remote, monthly USD billing */

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

export const LANGUAGE_PATHWAYS = [
  { value: 'conversational', label: 'Conversational', description: 'Natural rhythm, storytelling, and daily life fluency' },
  { value: 'academic', label: 'Academic', description: 'Structured curriculum for exam bodies and academic excellence' },
] as const;

export type LanguagePathway = (typeof LANGUAGE_PATHWAYS)[number]['value'];

export const LANGUAGE_PACKAGES = [
  { value: 'individual', label: 'Individual (1 person)' },
  { value: 'family_group', label: 'Family/Group (up to 3 people)' },
] as const;

export type LanguagePackage = (typeof LANGUAGE_PACKAGES)[number]['value'];

export const LANGUAGE_SESSIONS_PER_WEEK_OPTIONS = [1, 2] as const;
export const LANGUAGE_WEEKS_PER_MONTH = 4;
export const LANGUAGE_LEARNING_MODE = 'online' as const;
export const LANGUAGE_FEE_MODE = 'Online (Global)';

export const LANGUAGE_PROGRAM_INTRO =
  'Our language program offers two pathways designed to fit your goals, taught by native speakers who are also professionally trained language and music educators. Lessons are fully remote with flexible scheduling across time zones.';

export const LANGUAGE_PROGRAM_HIGHLIGHTS = [
  'Conversational pathway: natural rhythm, storytelling, and daily life fluency',
  'Academic pathway: rigorous curriculum for exam bodies and academic excellence',
  'Native-speaking instructors from the East African coast',
  'Professionally trained language and music educators',
  'Fully online — no onsite or hybrid options',
  'Flexible scheduling across time zones',
  'Customised curriculum for each student',
];

export const LANGUAGE_PRICING_NOTE =
  'Monthly billing due at the start of each month. Family/group rates are per shared session (not per person).';

export const LANGUAGE_PRICING = {
  individual: {
    1: { perSession: 20, sessionsPerMonth: 4, monthly: 80 },
    2: { perSession: 15, sessionsPerMonth: 8, monthly: 120 },
  },
  family_group: {
    1: { perSession: 30, sessionsPerMonth: 4, monthly: 120 },
    2: { perSession: 22, sessionsPerMonth: 8, monthly: 176 },
  },
} as const;

export function isLanguagesCategory(category?: string | null): boolean {
  return String(category || '').toLowerCase() === 'languages';
}

export function normalizeLanguagePackage(value?: string | null): LanguagePackage {
  return value === 'family_group' ? 'family_group' : 'individual';
}

export function normalizeLanguageSessionsPerWeek(value?: number | string | null): 1 | 2 {
  return Number(value) === 2 ? 2 : 1;
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

export function getLanguageFeeCourseNameForPackage(languagePackage?: string | null): string {
  return normalizeLanguagePackage(languagePackage) === 'family_group'
    ? 'Language Lessons - Family/Group'
    : 'Language Lessons - Individual';
}

/** @deprecated Use getLanguageFeeCourseNameForPackage */
export function getLanguageFeeCourseName(): string {
  return 'Language Lessons - Individual';
}

export function getLanguagePricingDetails(
  languagePackage?: string | null,
  sessionsPerWeek?: number | string | null
) {
  const pkg = normalizeLanguagePackage(languagePackage);
  const spw = normalizeLanguageSessionsPerWeek(sessionsPerWeek);
  return LANGUAGE_PRICING[pkg][spw];
}

export function getLanguageMonthlyPrice(
  languagePackage?: string | null,
  sessionsPerWeek?: number | string | null
): number {
  return getLanguagePricingDetails(languagePackage, sessionsPerWeek).monthly;
}

export function formatLanguageMonthlyPrice(
  languagePackage?: string | null,
  sessionsPerWeek?: number | string | null
): string {
  const pricing = getLanguagePricingDetails(languagePackage, sessionsPerWeek);
  return `$${pricing.monthly}/month ($${pricing.perSession}/session × ${pricing.sessionsPerMonth} sessions)`;
}

export function getLanguagePathwayLabel(pathway?: string | null): string {
  return LANGUAGE_PATHWAYS.find((p) => p.value === pathway)?.label ?? 'Conversational';
}

export function getLanguagePackageLabel(languagePackage?: string | null): string {
  return LANGUAGE_PACKAGES.find((p) => p.value === languagePackage)?.label ?? 'Individual';
}

export function buildLanguageInvoiceLineDescription(
  languageName: string,
  registration: {
    language_pathway?: string | null;
    language_package?: string | null;
    sessions_per_week?: number | string | null;
  }
): string {
  const pricing = getLanguagePricingDetails(registration.language_package, registration.sessions_per_week);
  const pathway = getLanguagePathwayLabel(registration.language_pathway);
  const pkg = getLanguagePackageLabel(registration.language_package);
  const spw = normalizeLanguageSessionsPerWeek(registration.sessions_per_week);
  return `${languageName} (${pathway}, ${pkg}) — ${spw} session${spw > 1 ? 's' : ''}/week — $${pricing.perSession}/session × ${pricing.sessionsPerMonth} sessions = $${pricing.monthly}/month`;
}
