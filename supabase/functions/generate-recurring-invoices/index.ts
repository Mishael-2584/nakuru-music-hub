// Supabase Edge Function: generate-recurring-invoices
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Use environment variables for keys
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const LANGUAGE_FEE_MODE = 'Online (Global)';
const LANGUAGE_PRICING = {
  individual: { 1: 80, 2: 120 },
  family_group: { 1: 120, 2: 176 },
};

function getLanguageFeeCourseName(languagePackage) {
  return languagePackage === 'family_group'
    ? 'Language Lessons - Family/Group'
    : 'Language Lessons - Individual';
}

function getLanguageMonthlyDefault(languagePackage, sessionsPerWeek) {
  const pkg = languagePackage === 'family_group' ? 'family_group' : 'individual';
  const spw = Number(sessionsPerWeek) === 2 ? 2 : 1;
  return LANGUAGE_PRICING[pkg][spw];
}

// Real-time currency conversion using Exchange Rate API
async function getExchangeRate(fromCurrency, toCurrency) {
  try {
    // Use Exchange Rate API (free tier)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch exchange rate from ${fromCurrency} to ${toCurrency}, using fallback rate`);
      // Fallback rates (updated periodically)
      const fallbackRates = {
        'USD_KES': 150.5, // 1 USD = 150.5 KES (approximate)
        'EUR_KES': 165.2, // 1 EUR = 165.2 KES (approximate)
        'GBP_KES': 192.8, // 1 GBP = 192.8 KES (approximate)
      };
      
      const rateKey = `${fromCurrency}_${toCurrency}`;
      return fallbackRates[rateKey] || 150.5; // Default to USD_KES rate
    }
    
    const data = await response.json();
    const rate = data.rates[toCurrency];
    
    if (!rate) {
      console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}, using fallback rate`);
      return 150.5; // Default fallback
    }
    
    console.log(`Real-time exchange rate: 1 ${fromCurrency} = ${rate} ${toCurrency}`);
    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    console.warn('Using fallback exchange rate');
    return 150.5; // Default fallback rate
  }
}

// Cache exchange rates to avoid excessive API calls
const exchangeRateCache = {};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

// Separate cache for admin-configured FX overrides (so changes apply quickly)
const ADMIN_OVERRIDE_CACHE_DURATION_MS = 60 * 1000; // 1 minute
let adminUsdToKesOverride: number | null = null;
let adminUsdToKesOverrideLoadedAt = 0;

async function getAdminUsdToKesRateFromSettings() {
  try {
    const { data, error } = await supabase
      .from('exchange_rate_settings')
      .select('rate')
      .eq('from_currency', 'USD')
      .eq('to_currency', 'KES')
      .maybeSingle();

    if (error || !data) return null;
    const rate = typeof data.rate === 'string' ? parseFloat(data.rate) : Number(data.rate);
    if (!rate || !Number.isFinite(rate) || rate <= 0) return null;
    return rate;
  } catch (e) {
    console.error('Failed to load admin USD->KES FX rate:', e);
    return null;
  }
}

async function getCachedExchangeRate(fromCurrency, toCurrency) {
  const effectiveFrom = fromCurrency === '$' ? 'USD' : fromCurrency;
  const cacheKey = `${effectiveFrom}_${toCurrency}`;
  const now = Date.now();
  
  // Admin override: use stored USD->KES rate for "$" fees
  if (toCurrency === 'KES' && effectiveFrom === 'USD') {
    if (
      adminUsdToKesOverride != null &&
      (now - adminUsdToKesOverrideLoadedAt) < ADMIN_OVERRIDE_CACHE_DURATION_MS
    ) {
      return adminUsdToKesOverride;
    }

    const overrideRate = await getAdminUsdToKesRateFromSettings();
    if (overrideRate) {
      adminUsdToKesOverride = overrideRate;
      adminUsdToKesOverrideLoadedAt = now;
      // Also seed the general exchange-rate cache
      exchangeRateCache[cacheKey] = { rate: overrideRate, timestamp: now };
      console.log(`Using admin FX override: 1 USD = ${overrideRate} KES`);
      return overrideRate;
    }
    // If no override set, fall through to live API
  }

  // Check if we have a cached rate that's still valid
  if (exchangeRateCache[cacheKey] && (now - exchangeRateCache[cacheKey].timestamp) < CACHE_DURATION) {
    console.log(`Using cached exchange rate: 1 ${fromCurrency} = ${exchangeRateCache[cacheKey].rate} ${toCurrency}`);
    return exchangeRateCache[cacheKey].rate;
  }
  
  // Fetch new rate
  const rate = await getExchangeRate(effectiveFrom, toCurrency);
  
  // Cache the new rate
  exchangeRateCache[cacheKey] = {
    rate,
    timestamp: now
  };
  
  return rate;
}

// Convert foreign currency to KES using real-time exchange rates
async function convertCurrencyToKES(fee) {
  if (fee.currency && fee.currency !== 'KSh' && fee.price) {
    try {
      const exchangeRate = await getCachedExchangeRate(fee.currency, 'KES');
      const originalPrice = fee.price;
      fee.price = Math.round(fee.price * exchangeRate * 100) / 100; // Round to 2 decimal places
      fee.currency = 'KSh';
      console.log(`Converted ${originalPrice} ${fee.currency} to KES: ${fee.price} KSh (rate: 1 ${fee.currency} = ${exchangeRate} KES)`);
    } catch (error) {
      console.error('Error converting currency:', error);
      // Fallback to default rate if conversion fails
      const fallbackRate = fee.currency === '$' ? 150.5 : 150.5;
      fee.price = Math.round(fee.price * fallbackRate * 100) / 100;
      fee.currency = 'KSh';
      console.log(`Used fallback rate for ${fee.currency}: ${fee.price} KSh`);
    }
  }
  return fee;
}

async function sendInvoiceEmail(invoice, student, isReminder = false) {
  const subject = isReminder
    ? `Payment Reminder: Invoice for ${student.student_name} - Damon Music Academy`
    : `Your Invoice for ${student.student_name} - Damon Music Academy`;
  const body = isReminder
    ? `Dear ${student.student_name},\n\nThis is a friendly reminder that your invoice for the current period is due.\n\nInvoice Amount: KES ${invoice.amount_due}\nPeriod: ${invoice.period_start} to ${invoice.period_end}\nDue Date: ${invoice.due_date}\n\nIf you have already paid, please disregard this message.\n\nThank you!\nDamon Music Academy`
    : `Dear ${student.student_name},\n\nPlease find your invoice for the current period below.\n\nInvoice Amount: KES ${invoice.amount_due}\nPeriod: ${invoice.period_start} to ${invoice.period_end}\nDue Date: ${invoice.due_date}\n\nIf you have any questions, let us know.\n\nThank you!\nDamon Music Academy`;
  const { error } = await supabase.functions.invoke('send-confirmation-email', {
    body: {
      to: student.email,
      subject,
      text: body,
      invoice,
      student
    }
  });
  if (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
  return true;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseLocalDateString(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getYearMonthKey(d) {
  const date = typeof d === 'string' ? parseLocalDateString(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isFutureBillingPeriod(periodStart, reference = new Date()) {
  return getYearMonthKey(periodStart) > getYearMonthKey(reference);
}

function filterInvoicesUpToCurrentMonth(invoices, reference = new Date()) {
  return (invoices || []).filter((inv) => !isFutureBillingPeriod(inv.period_start, reference));
}

function getLatestInvoiceByPeriodEnd(invoices) {
  return [...(invoices || [])].sort(
    (a, b) => parseLocalDateString(b.period_end).getTime() - parseLocalDateString(a.period_end).getTime()
  )[0];
}

function computeNextBillingPeriod({
  paymentType,
  isFirstInvoice,
  registrationCreatedAt,
  lastPeriodEnd,
  reference = new Date(),
}) {
  let periodStart;
  let periodEnd;

  if (paymentType === 'monthly' || paymentType === 'per_class') {
    if (isFirstInvoice) {
      periodStart = new Date(reference.getFullYear(), reference.getMonth(), 1);
      periodEnd = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
    } else {
      if (!lastPeriodEnd) return null;
      const lastEnd = parseLocalDateString(lastPeriodEnd);
      periodStart = new Date(lastEnd.getFullYear(), lastEnd.getMonth() + 1, 1);
      periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
    }
  } else if (paymentType === 'term') {
    if (isFirstInvoice) {
      periodStart = new Date(reference.getFullYear(), reference.getMonth(), 1);
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 3);
      periodEnd.setDate(periodEnd.getDate() - 1);
    } else {
      if (!lastPeriodEnd) return null;
      const lastEnd = parseLocalDateString(lastPeriodEnd);
      periodStart = new Date(lastEnd);
      periodStart.setDate(periodStart.getDate() + 1);
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 3);
      periodEnd.setDate(periodEnd.getDate() - 1);
    }
  } else {
    return null;
  }

  const periodStartStr = formatDate(periodStart);
  if (isFutureBillingPeriod(periodStartStr, reference)) {
    return null;
  }

  return {
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
  };
}

// Improved fee lookup function with fallbacks and real-time rates
async function findFeeForRegistration(registration) {
  const courseCategory = registration.course_category || 'Music';
  const courseCategoryLower = String(courseCategory).toLowerCase();
  const instrument = registration.instrument;
  const learningMode = registration.learning_mode || 'in-person';
  
  // Determine payment type based on course category (case-insensitive)
  let paymentType = 'monthly'; // Default
  if (courseCategoryLower === 'production' || courseCategoryLower === 'photography') {
    paymentType = 'term';
  } else if (courseCategoryLower === 'technology') {
    paymentType = 'per_class'; // Technology courses use per_class billing
  } else if (courseCategoryLower === 'languages') {
    paymentType = 'monthly';
  }
  
  console.log('Looking for fee with preferences:', {
    courseCategory,
    instrument,
    learningMode,
    paymentType
  });
  
  // Normalize learning mode for database matching
  const normalizeLearningMode = (mode) => {
    switch (mode.toLowerCase()) {
      case 'online':
        return 'Online (Global)';
      case 'home':
      case 'home (nakuru & environs)':
        return 'Home (Nakuru & Environs)';
      case 'in-person':
      case 'physical':
      case 'at the academy':
        return 'At the Academy';
      default:
        return mode;
    }
  };
  
  const normalizedLearningMode = courseCategoryLower === 'languages'
    ? LANGUAGE_FEE_MODE
    : normalizeLearningMode(learningMode);
  console.log('Normalized learning mode:', normalizedLearningMode);

  const normalizeTermPeriod = (value) => {
    const v = String(value || '').toLowerCase();
    if (v.includes('final')) return 'final_term';
    return '1st_term';
  };
  const getTermDurationPattern = (term) => (term === 'final_term' ? '%final%' : '%1st%');
  const getProductionFeeCourseName = (productionType) => {
    const t = String(productionType || '').trim().toLowerCase();
    if (t.includes('live sound')) return 'Live Sound Engineering';
    if (t.includes('music production')) return 'Music Production';
    if (t === 'videography') return 'Photography & Videography';
    return 'Music Production';
  };
  const getTermlyFeeCourseType = (category, productionType) => {
    const cat = String(category || '').toLowerCase();
    if (cat === 'production' && String(productionType || '').toLowerCase() === 'videography') {
      return 'photography';
    }
    return cat;
  };
  const getDefaultTermPrice = (category, productionType, term) => {
    const course = category === 'photography'
      ? 'Photography & Videography'
      : getProductionFeeCourseName(productionType);
    if (course === 'Live Sound Engineering') {
      return term === 'final_term' ? 26000 : 28000;
    }
    return term === 'final_term' ? 42500 : 45500;
  };
  const TERMLY_FEE_MODE_ACADEMY = 'At the Academy';

  const termPeriod =
    paymentType === 'term' ? normalizeTermPeriod(registration.term_period) : null;

  let feeCourseType = courseCategoryLower;
  let normalizedCourseName = instrument;
  if (courseCategoryLower === 'music') {
    normalizedCourseName = 'Instrumental & Music Theory';
  } else if (courseCategoryLower === 'production' || courseCategoryLower === 'photography') {
    feeCourseType = getTermlyFeeCourseType(registration.course_category, registration.production_type);
    normalizedCourseName = courseCategoryLower === 'photography'
      ? 'Photography & Videography'
      : getProductionFeeCourseName(registration.production_type);
  } else if (courseCategoryLower === 'art') {
    normalizedCourseName = 'Art Classes';
  } else if (courseCategoryLower === 'technology') {
    normalizedCourseName = registration.technology_type || 'Web Design & Programming';
  } else if (courseCategoryLower === 'languages') {
    normalizedCourseName = getLanguageFeeCourseName(registration.language_package);
  }

  const pickBestMusicMonthlyFee = (fees, reg) => {
    if (!fees?.length) return null;
    const lm = String(reg.learning_mode || '').toLowerCase();
    const isHome = lm === 'home' || lm.includes('home');
    if (isHome) {
      if (reg.home_lesson_duration === '30_min') {
        return fees.find((f) => (f.duration || '').toLowerCase().includes('30')) || fees[0];
      }
      if (reg.home_lesson_duration === '1_hour') {
        return fees.find((f) => (f.duration || '').toLowerCase().includes('1 hour')) || fees[0];
      }
    }
    return (
      fees.find((f) => (f.duration || '').toLowerCase().includes('1 hour')) ||
      fees.reduce((best, f) =>
        (Number(f.hours_per_session) || 0) > (Number(best.hours_per_session) || 0) ? f : best
      )
    );
  };

  const resolveMusicMonthlyTotalKes = (reg, onlineMonthlyKes) => {
    const lm = String(reg.learning_mode || '').toLowerCase();
    const sessions = Math.max(1, parseInt(String(reg.sessions_per_week || 1), 10) || 1);
    if (lm === 'home' || lm.includes('home')) {
      const base = reg.home_lesson_duration === '1_hour' ? 12000 : 6000;
      return base * sessions;
    }
    if (lm === 'online') return Math.round(onlineMonthlyKes * sessions);
    return 6000 * sessions;
  };

  const findFeesForMode = async (mode) => {
    let q = supabase
      .from('fees')
      .select('*')
      .eq('course_type', feeCourseType)
      .eq('course_name', normalizedCourseName)
      .eq('mode', mode)
      .eq('payment_type', paymentType)
      .eq('is_active', true);
    if (paymentType === 'term' && termPeriod) {
      q = q.ilike('duration', getTermDurationPattern(termPeriod));
    }
    if (courseCategoryLower === 'languages' && paymentType === 'monthly') {
      const spw = Number(registration.sessions_per_week) === 2 ? 2 : 1;
      q = q.eq('sessions_per_week', spw);
    }
    return q;
  };

  if (paymentType === 'term') {
    for (const mode of [normalizedLearningMode, TERMLY_FEE_MODE_ACADEMY]) {
      const { data: exactFee, error: exactFeeError } = await findFeesForMode(mode).maybeSingle();
      if (exactFee && !exactFeeError) {
        console.log('Found term fee match:', exactFee);
        return convertCurrencyToKES(exactFee);
      }
    }
  } else {
    const { data: feeRows, error: exactFeeError } = await findFeesForMode(normalizedLearningMode);
    let exactFee = null;
    if (!exactFeeError && feeRows?.length === 1) {
      exactFee = feeRows[0];
    } else if (!exactFeeError && feeRows && feeRows.length > 1 && courseCategoryLower === 'music' && paymentType === 'monthly') {
      exactFee = pickBestMusicMonthlyFee(feeRows, registration);
      console.log('Picked music monthly fee from multiple rows:', exactFee);
    } else if (feeRows?.length) {
      exactFee = feeRows[0];
    }
    if (exactFee && !exactFeeError) {
      const converted = await convertCurrencyToKES(exactFee);
      if (courseCategoryLower === 'music' && paymentType === 'monthly') {
        const sessions = Math.max(1, parseInt(String(registration.sessions_per_week || 1), 10) || 1);
        const monthlyTotal = resolveMusicMonthlyTotalKes(registration, converted.price);
        return { ...converted, price: monthlyTotal / sessions, sessions_per_week: 1 };
      }
      console.log('Found exact fee match with learning mode and payment type:', converted);
      return converted;
    }
  }
  
  console.log('No exact fee match found, trying fallback options');
  
  // Fallback 1: course type + program name + mode
  let modeFeeQuery = supabase
    .from('fees')
    .select('*')
    .eq('course_type', feeCourseType)
    .eq('course_name', normalizedCourseName)
    .eq('mode', normalizedLearningMode)
    .eq('payment_type', paymentType)
    .eq('is_active', true);
  if (paymentType === 'term' && termPeriod) {
    modeFeeQuery = modeFeeQuery.ilike('duration', getTermDurationPattern(termPeriod));
  }
  let { data: modeFeeRows, error: modeFeeError } = await modeFeeQuery;
  let modeFee =
    modeFeeRows?.length === 1
      ? modeFeeRows[0]
      : modeFeeRows && modeFeeRows.length > 1 && courseCategoryLower === 'music' && paymentType === 'monthly'
        ? pickBestMusicMonthlyFee(modeFeeRows, registration)
        : modeFeeRows?.[0] ?? null;
  if ((!modeFee || modeFeeError) && paymentType === 'term') {
    const academyTry = await findTermFee(TERMLY_FEE_MODE_ACADEMY);
    modeFee = academyTry.data;
    modeFeeError = academyTry.error;
  }
  
  if (modeFee && !modeFeeError) {
    console.log('Found fee by course_type and learning_mode with payment type:', modeFee);
    const convertedFee = await convertCurrencyToKES(modeFee);
    return convertedFee;
  }
  
  // Fallback 2: Try to find by course_type only with correct payment type
  let typeFeeQuery = supabase
    .from('fees')
    .select('*')
    .eq('course_type', feeCourseType)
    .eq('course_name', normalizedCourseName)
    .eq('payment_type', paymentType)
    .eq('is_active', true);
  if (paymentType === 'term' && termPeriod) {
    typeFeeQuery = typeFeeQuery.ilike('duration', getTermDurationPattern(termPeriod));
  }
  const { data: typeFee, error: typeFeeError } = await typeFeeQuery.maybeSingle();
  
  if (typeFee && !typeFeeError) {
    console.log('Found fee by course_type only with payment type:', typeFee);
    const convertedFee = await convertCurrencyToKES(typeFee);
    return convertedFee;
  }
  
  // Fallback 3: For termly courses, try to find any term fee for the course category
  if (paymentType === 'term') {
    const { data: termFee, error: termFeeError } = await supabase
      .from('fees')
      .select('*')
      .eq('course_type', feeCourseType)
      .eq('course_name', normalizedCourseName)
      .eq('payment_type', 'term')
      .ilike('duration', getTermDurationPattern(termPeriod || '1st_term'))
      .eq('is_active', true)
      .maybeSingle();
    
    if (termFee && !termFeeError) {
      console.log('Found term fee for course category:', termFee);
      const convertedFee = await convertCurrencyToKES(termFee);
      return convertedFee;
    }
  }
  
  // Fallback 4: Try to find any fee for the normalized learning mode with correct payment type
  const { data: modeAnyFee, error: modeAnyFeeError } = await supabase
    .from('fees')
    .select('*')
    .eq('mode', normalizedLearningMode)
    .eq('payment_type', paymentType)
    .eq('is_active', true)
    .maybeSingle();
  
  if (modeAnyFee && !modeAnyFeeError) {
    console.log('Found fee for learning mode with payment type:', modeAnyFee);
    const convertedFee = await convertCurrencyToKES(modeAnyFee);
    return convertedFee;
  }
  
  // Fallback 5: Try to find any active fee with correct payment type
  const { data: anyFee, error: anyFeeError } = await supabase
    .from('fees')
    .select('*')
    .eq('payment_type', paymentType)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  
  if (anyFee && !anyFeeError) {
    console.log('Found fallback fee with payment type:', anyFee);
    const convertedFee = await convertCurrencyToKES(anyFee);
    return convertedFee;
  }
  
  // Fallback 6: If still no fee found, fetch all active fees to get real rates
  console.log('No fee found with fallbacks, fetching all active fees for real rates');
  const { data: allFees, error: allFeesError } = await supabase
    .from('fees')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });
  
  if (allFeesError) {
    console.error('Error fetching all fees:', allFeesError);
    throw allFeesError;
  }
  
  if (allFees && allFees.length > 0) {
    // Find the most appropriate fee based on course category and payment type
    let bestMatch = null;
    
    // First try to find by course category
    bestMatch = allFees.find(f => String(f.course_type || '').toLowerCase() === courseCategoryLower);
    
    // If no match by course category, find by payment type
    if (!bestMatch) {
      bestMatch = allFees.find(f => f.payment_type === paymentType);
    }
    
    // If still no match, use the first available fee
    if (!bestMatch) {
      bestMatch = allFees[0];
    }
    
    console.log('Using real fee from database as fallback:', bestMatch);
    const convertedFee = await convertCurrencyToKES(bestMatch);
    return convertedFee;
  }
  
  // Fallback 7: Last resort - create a default fee structure based on real market rates
  console.log('No fees found in database, creating default fee structure');
  let defaultPrice = 5000; // Default in KES
  let defaultCurrency = 'KSh';
  
  if (paymentType === 'term') {
    // Termly courses (production, photography) - higher rates
    if (paymentType === 'term') {
      defaultPrice = getDefaultTermPrice(
        registration.course_category,
        registration.production_type,
        termPeriod || '1st_term'
      );
    } else if (courseCategoryLower === 'photography') {
      defaultPrice = 45500;
    } else {
      defaultPrice = 40000; // KES 40,000 for other termly courses
    }
  } else if (courseCategoryLower === 'technology') {
    if (learningMode === 'online') {
      defaultPrice = 2200;
    } else {
      defaultPrice = 2200;
    }
  } else if (courseCategoryLower === 'languages') {
    defaultPrice = getLanguageMonthlyDefault(registration.language_package, registration.sessions_per_week);
    defaultCurrency = '$';
  } else if (String(learningMode).toLowerCase() === 'online') {
    defaultPrice = 44; // $44 USD
    defaultCurrency = '$';
  } else if (String(learningMode).toLowerCase() === 'home') {
    const dur = registration.home_lesson_duration;
    defaultPrice = (dur === '30_min' || dur === '1_hour') ? (dur === '30_min' ? 6000 : 12000) : 12000; // 30 min = 6,000; 1 hr = 12,000
  } else {
    defaultPrice = 6000; // KES 6,000 for academy lessons
  }
  
  const defaultFee = {
    id: 'default',
    course_type: courseCategoryLower,
    course_name: instrument,
    price: defaultPrice,
    currency: defaultCurrency,
    payment_type: paymentType,
    mode: learningMode,
    sessions_per_week: paymentType === 'term' ? 3 : 1,
    is_active: true
  };
  
  // Convert currency if needed
  const convertedFee = await convertCurrencyToKES(defaultFee);
  
  console.log('Using default fee structure based on real market rates:', convertedFee);
  return convertedFee;
}

// Helper function to determine if we should send an invoice reminder
function shouldSendInvoiceReminder(invoice, period) {
  const now = new Date();
  const dueDate = new Date(invoice.due_date);
  
  // Send reminder if:
  // 1. It's 7 days before the due date, OR
  // 2. It's the due date (7th of the month) and invoice is still pending
  const sevenDaysBeforeDue = new Date(dueDate);
  sevenDaysBeforeDue.setDate(sevenDaysBeforeDue.getDate() - 7);
  
  return (
    (now >= sevenDaysBeforeDue && now < dueDate) || // 7 days before due date
    (now.getDate() === 7 && now.getMonth() === dueDate.getMonth() && now.getFullYear() === dueDate.getFullYear()) // On due date
  );
}

// Helper function to determine if we should create a new invoice
function shouldCreateNewInvoice(period, now, isFirstInvoice) {
  const periodStart = period.periodStart;
  const periodEnd = period.periodEnd;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (isFirstInvoice) {
    // First invoice: Generate on the 30th of the enrollment month
    const enrollmentMonth = periodEnd.getMonth();
    const enrollmentYear = periodEnd.getFullYear();
    const thirtiethOfMonth = new Date(enrollmentYear, enrollmentMonth, 30);
    
    return today.getTime() === thirtiethOfMonth.getTime();
  } else {
    // Subsequent invoices: Generate on specific dates
    const sevenDaysBeforePeriodEnd = new Date(periodEnd);
    sevenDaysBeforePeriodEnd.setDate(sevenDaysBeforePeriodEnd.getDate() - 7);
    
    const seventhOfNextMonth = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 7);
    
    return (
      today.getTime() === sevenDaysBeforePeriodEnd.getTime() || // 7 days before period ends
      today.getTime() === seventhOfNextMonth.getTime() // 7th of next month (due date)
    );
  }
}

async function generateInvoicesForRegistration(registration, fee, student, summary) {
  const courseCategory = registration.course_category || 'Music';
  const courseCategoryLower = String(courseCategory).toLowerCase();
  const learningMode = (registration.learning_mode || 'in-person').toLowerCase();

  if (courseCategoryLower === 'music' && fee.payment_type === 'monthly') {
    const sessions = Math.max(1, parseInt(String(registration.sessions_per_week || 1), 10) || 1);
    const lm = learningMode;
    let monthlyTotal = fee.price * sessions;
    if (lm === 'home' || lm.includes('home')) {
      monthlyTotal = (registration.home_lesson_duration === '1_hour' ? 12000 : 6000) * sessions;
    } else if (lm !== 'online') {
      monthlyTotal = 6000 * sessions;
    }
    fee = { ...fee, price: monthlyTotal };
    console.log('Music monthly recurring amount:', monthlyTotal);
  }

  // Check if this is the first invoice for this student
  const { data: existingInvoices, error: existingInvoicesError } = await supabase
    .from('invoices')
    .select('*')
    .eq('student_id', student.id);
  
  if (existingInvoicesError) throw existingInvoicesError;
  
  const now = new Date();
  const billableExistingInvoices = filterInvoicesUpToCurrentMonth(existingInvoices, now);
  const isFirstInvoice = billableExistingInvoices.length === 0;
  const latestInvoice = getLatestInvoiceByPeriodEnd(billableExistingInvoices);
  let periods = [];

  const nextPeriod = computeNextBillingPeriod({
    paymentType: fee.payment_type,
    isFirstInvoice,
    registrationCreatedAt: registration.created_at,
    lastPeriodEnd: latestInvoice?.period_end ?? null,
    reference: now,
  });

  if (nextPeriod) {
    const dueDate = isFirstInvoice
      ? new Date(nextPeriod.periodEnd.getFullYear(), nextPeriod.periodEnd.getMonth(), nextPeriod.periodEnd.getDate())
      : new Date(Date.UTC(nextPeriod.periodEnd.getFullYear(), nextPeriod.periodEnd.getMonth() + 1, 6, 21, 0, 0, 0));
    periods.push({
      periodStart: nextPeriod.periodStart,
      periodEnd: nextPeriod.periodEnd,
      dueDate,
    });
  }

  for (const period of periods) {
    const periodStartStr = formatDate(period.periodStart);
    const periodEndStr = formatDate(period.periodEnd);
    
    // Check if invoice exists for this period (using student_id only)
    const { data: existingInvoice, error: existingError } = await supabase
      .from('invoices')
      .select('*')
      .eq('student_id', student.id)
      .eq('period_start', periodStartStr)
      .eq('period_end', periodEndStr)
      .maybeSingle();
    if (existingError) throw existingError;
    
    if (existingInvoice) {
      // Check if we should send reminder based on timing
      const shouldSendReminder = shouldSendInvoiceReminder(existingInvoice, period);
      if (shouldSendReminder && existingInvoice.status !== 'paid') {
        await sendInvoiceEmail(existingInvoice, student, true);
        summary.reminders++;
      } else {
        summary.skipped++;
      }
      continue;
    }
    
    // Check if it's time to create a new invoice based on timing rules
    const shouldCreateInvoice = shouldCreateNewInvoice(period, now, isFirstInvoice);
    if (!shouldCreateInvoice) {
      summary.skipped++;
      continue;
    }

    if (isFutureBillingPeriod(periodStartStr, now)) {
      summary.skipped++;
      continue;
    }
    // Calculate invoice amount with partial month billing logic
    let invoiceAmount = fee.price;
    let notes = null;
    
    // Termly: flat fee per term (never multiply by sessions_per_week from registration)
    if (fee.payment_type === 'term') {
      invoiceAmount = fee.price;
      console.log('Termly recurring invoice (flat term fee):', invoiceAmount);
    } else if (fee.payment_type === 'per_class') {
      const sessionsPerWeek = registration.sessions_per_week || 1;
      const numWeeks = 4; // Always 4 weeks for monthly billing
      invoiceAmount = fee.price * sessionsPerWeek * numWeeks;
      console.log('Per-class billing calculation:', {
        pricePerClass: fee.price,
        sessionsPerWeek,
        numWeeks,
        totalAmount: invoiceAmount
      });
    }
    
    // Apply partial month billing logic for subsequent invoices (only for monthly payment type, not Technology)
    if (!isFirstInvoice && fee.payment_type === 'monthly' && courseCategory !== 'Technology' && courseCategory !== 'Languages') {
      // For subsequent invoices, check if student enrolled mid-month in the first month
      const registrationDate = new Date(registration.created_at);
      
      // If student enrolled after the 1st of their enrollment month, calculate partial billing
      if (registrationDate.getDate() > 1) {
        const daysBeforeEnrollment = registrationDate.getDate() - 1;
        const sessionsPerWeek = registration.sessions_per_week || 1;
        const sessionsBeforeEnrollment = Math.ceil((daysBeforeEnrollment / 7) * sessionsPerWeek);
        
        // Calculate deduction based on session price
        const sessionPrice = fee.price / (sessionsPerWeek * 4); // Assuming 4 weeks per month
        const deductionAmount = sessionsBeforeEnrollment * sessionPrice;
        
        // Deduct the amount for sessions before enrollment
        invoiceAmount = Math.max(0, fee.price - deductionAmount);
        
        notes = `Deducted KES ${deductionAmount.toLocaleString()} for ${sessionsBeforeEnrollment} sessions before enrollment date.`;
        
        console.log('📊 Partial month billing applied:', {
          enrollmentDate: registrationDate.toISOString().slice(0, 10),
          daysBeforeEnrollment,
          sessionsBeforeEnrollment,
          deductionAmount,
          adjustedInvoiceAmount: invoiceAmount
        });
      }
    }
    
    // For Technology courses (per_class), first invoice is always: per_class price × sessions_per_week × 4 weeks
    // No partial month logic applies to Technology courses
    
    // Create invoice (using current schema with student_id only)
    const invoiceData = {
      student_id: student.id,
      fee_id: fee.id,
      amount_due: invoiceAmount,
      period_start: periodStartStr,
      period_end: periodEndStr,
      due_date: formatDate(period.dueDate),
      status: 'pending',
      is_auto_generated: true,
      admin_override: false,
      notes: notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select('*')
      .single();
    if (invError) {
      summary.errors++;
      console.error('Failed to create invoice:', invError);
      continue;
    }
    await sendInvoiceEmail(invoice, student, false);
    summary.created++;
  }
}

serve(async (req) => {
  try {
    // Fetch all active registrations
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('status', 'approved');
    if (error) throw error;
    if (!registrations) return new Response('No registrations found', { status: 200 });

    const summary = { created: 0, skipped: 0, reminders: 0, errors: 0 };

    for (const reg of registrations) {
      try {
        // Fetch student
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('registration_id', reg.id)
          .single();
        if (studentError || !student) throw studentError || new Error('Student not found');
        
        // Use improved fee lookup
        const fee = await findFeeForRegistration(reg);
        if (!fee) throw new Error('Fee not found for registration');
        
        await generateInvoicesForRegistration(reg, fee, student, summary);
      } catch (err) {
        console.error(`Failed to process registration ${reg.id}:`, err);
        summary.errors++;
      }
    }
    console.log('Recurring invoice generation summary:', summary);
    return new Response('Recurring invoices processed. Summary: ' + JSON.stringify(summary), { status: 200 });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}); 