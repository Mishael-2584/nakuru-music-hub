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
  if (t === 'videography') return 'Videography';
  return 'Music Production';
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
  return term === 'final_term' ? 42500 : 45500;
}

export const TERMLY_COURSE_CATEGORIES = new Set(['Production', 'Photography']);

export function isTermlyCourseCategory(category: string): boolean {
  return (
    TERMLY_COURSE_CATEGORIES.has(category) ||
    ['production', 'photography'].includes(String(category || '').toLowerCase())
  );
}
