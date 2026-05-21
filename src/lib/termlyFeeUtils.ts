/** Termly billing helpers (Production, Photography, etc.) */

export type TermPeriod = '1st_term' | 'final_term';

export function normalizeTermPeriod(value?: string | null): TermPeriod {
  const v = String(value || '').toLowerCase();
  if (v.includes('final')) return 'final_term';
  return '1st_term';
}

export function getTermDurationPattern(term: TermPeriod): string {
  return term === 'final_term' ? '%final%' : '%1st%';
}

/** Map registration production_type to fees.course_name */
export function getProductionFeeCourseName(productionType?: string | null): string {
  const t = String(productionType || '').trim().toLowerCase();
  if (t.includes('live sound')) return 'Live Sound Engineering';
  if (t.includes('music production')) return 'Music Production';
  if (t === 'videography') return 'Photography & Videography';
  return 'Music Production';
}

/** DB course_type for fee lookup (Videography under Production uses photography fees) */
export function getTermlyFeeCourseType(
  courseCategory: string,
  productionType?: string | null
): string {
  const cat = String(courseCategory || '').toLowerCase();
  if (cat === 'production' && String(productionType || '').toLowerCase() === 'videography') {
    return 'photography';
  }
  return cat;
}

/** DB course_name for term fee lookup */
export function getTermlyFeeCourseName(
  courseCategory: string,
  registration: {
    production_type?: string | null;
    instrument?: string | null;
  }
): string {
  const cat = String(courseCategory || '').toLowerCase();
  if (cat === 'production') {
    return getProductionFeeCourseName(registration.production_type);
  }
  if (cat === 'photography') {
    return 'Photography & Videography';
  }
  return '';
}

/** Fallback invoice amounts when no DB fee row is found */
export function getDefaultProductionTermPrice(
  productionType?: string | null,
  term: TermPeriod = '1st_term'
): number {
  const course = getProductionFeeCourseName(productionType);
  if (course === 'Live Sound Engineering') {
    return term === 'final_term' ? 26000 : 28000;
  }
  if (course === 'Music Production') {
    return term === 'final_term' ? 42500 : 45500;
  }
  if (course === 'Photography & Videography') {
    return term === 'final_term' ? 42500 : 45500;
  }
  return term === 'final_term' ? 42500 : 45500;
}

export function getDefaultTermPrice(
  courseCategory: string,
  registration: { production_type?: string | null },
  term: TermPeriod = '1st_term'
): number {
  const cat = String(courseCategory || '').toLowerCase();
  if (cat === 'production') {
    return getDefaultProductionTermPrice(registration.production_type, term);
  }
  if (cat === 'photography') {
    return term === 'final_term' ? 42500 : 45500;
  }
  return term === 'final_term' ? 42500 : 45500;
}

/** All termly programs and prices (for docs / validation) */
export const TERMLY_PROGRAM_FEES: ReadonlyArray<{
  program: string;
  term: TermPeriod;
  priceKes: number;
  sessionsPerWeek: number;
  hoursPerSession: number;
}> = [
  { program: 'Music Production', term: '1st_term', priceKes: 45500, sessionsPerWeek: 3, hoursPerSession: 1 },
  { program: 'Music Production', term: 'final_term', priceKes: 42500, sessionsPerWeek: 3, hoursPerSession: 1 },
  { program: 'Live Sound Engineering', term: '1st_term', priceKes: 28000, sessionsPerWeek: 2, hoursPerSession: 2 },
  { program: 'Live Sound Engineering', term: 'final_term', priceKes: 26000, sessionsPerWeek: 2, hoursPerSession: 2 },
  { program: 'Photography & Videography', term: '1st_term', priceKes: 45500, sessionsPerWeek: 3, hoursPerSession: 1 },
  { program: 'Photography & Videography', term: 'final_term', priceKes: 42500, sessionsPerWeek: 3, hoursPerSession: 1 },
];

export const TERMLY_COURSE_CATEGORIES = new Set(['Production', 'Photography']);

export function isTermlyCourseCategory(category: string): boolean {
  return (
    TERMLY_COURSE_CATEGORIES.has(category) ||
    ['production', 'photography'].includes(String(category || '').toLowerCase())
  );
}

export function getTermDisplayLabel(
  termPeriod?: string | null,
  feeDuration?: string | null
): string {
  const d = String(feeDuration || '');
  if (d.toLowerCase().includes('final')) return 'Final Term';
  if (d.toLowerCase().includes('1st')) return '1st Term';
  return normalizeTermPeriod(termPeriod) === 'final_term' ? 'Final Term' : '1st Term';
}

export function getTermScheduleNote(fee: {
  sessions_per_week?: number | null;
  hours_per_session?: number | null;
}): string {
  const sessions = fee.sessions_per_week || 3;
  const hours = fee.hours_per_session ?? 1;
  if (hours >= 2) {
    return `${sessions} sessions/week, ${hours} hrs each`;
  }
  return `${sessions} sessions/week, 1 hr each`;
}

/** Physical academy pricing is used for term fees when no Online row exists */
export const TERMLY_FEE_MODE_ACADEMY = 'At the Academy';
