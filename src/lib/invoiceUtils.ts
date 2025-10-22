import { supabase } from '../integrations/supabase/client';
import { generateQuotePDF } from './pdfGenerator';
import { Invoice } from '../integrations/supabase/types';
import { sendInvoiceEmail } from './emailService';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  lessonIds: string[];
}

export interface InvoiceCalculationResult {
  lineItems: InvoiceLineItem[];
  subtotal: number;
  total: number;
}

// Real-time currency conversion using Exchange Rate API
async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  try {
    // Use Exchange Rate API (free tier)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch exchange rate from ${fromCurrency} to ${toCurrency}, using fallback rate`);
      // Fallback rates (updated periodically)
      const fallbackRates: { [key: string]: number } = {
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
const exchangeRateCache: Map<string, { rate: number; timestamp: number }> = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

async function getCachedExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const now = Date.now();
  
  // Check if we have a cached rate that's still valid
  const cached = exchangeRateCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached exchange rate: 1 ${fromCurrency} = ${cached.rate} ${toCurrency}`);
    return cached.rate;
  }
  
  // Fetch new rate
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  
  // Cache the new rate
  exchangeRateCache.set(cacheKey, {
    rate,
    timestamp: now
  });
  
  return rate;
}

/**
 * Calculate invoice line items and totals for a student for a given period.
 * @param studentId - The student's UUID
 * @param periodStart - Start date (YYYY-MM-DD)
 * @param periodEnd - End date (YYYY-MM-DD)
 * @returns InvoiceCalculationResult
 */
export async function calculateStudentInvoice(studentId: string, periodStart: string, periodEnd: string): Promise<InvoiceCalculationResult> {
  // Fetch all completed/confirmed lessons for the student in the period
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('student_id', studentId)
    .gte('lesson_date', periodStart)
    .lte('lesson_date', periodEnd)
    .in('status', ['completed', 'confirmed']);

  if (lessonsError) throw lessonsError;
  if (!lessons || lessons.length === 0) {
    return { lineItems: [], subtotal: 0, total: 0 };
  }

  // Fetch all active fees
  const { data: fees, error: feesError } = await supabase
    .from('fees')
    .select('*')
    .eq('is_active', true);
  if (feesError) throw feesError;

  // Group lessons by type/mode/level for pricing
  const lineItems: InvoiceLineItem[] = [];
  for (const fee of fees) {
    // Find lessons matching this fee (by course_type, course_name, mode, etc.)
    const matchingLessons = lessons.filter(lesson => {
      // Match by course_type, mode, lesson_type, etc. (customize as needed)
      return (
        lesson.lesson_type === (fee.course_type || 'regular') &&
        (!fee.mode || lesson.mode === fee.mode) &&
        (!fee.level || lesson.level === fee.level)
      );
    });
    if (matchingLessons.length > 0) {
      lineItems.push({
        description: `${fee.course_name}${fee.mode ? ' - ' + fee.mode : ''}`,
        quantity: matchingLessons.length,
        unitPrice: fee.price,
        amount: fee.price * matchingLessons.length,
        lessonIds: matchingLessons.map(l => l.id),
      });
    }
  }

  // Add any lessons that didn't match a fee as a fallback
  const matchedLessonIds = lineItems.flatMap(item => item.lessonIds);
  const unmatchedLessons = lessons.filter(l => !matchedLessonIds.includes(l.id));
  for (const lesson of unmatchedLessons) {
    lineItems.push({
      description: lesson.title || 'Lesson',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      lessonIds: [lesson.id],
    });
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal; // Add tax/discount logic if needed

  return { lineItems, subtotal, total };
}

/**
 * Generate a PDF for an invoice and upload to Supabase Storage. Returns the public URL.
 * @param invoice - The invoice object (with lessons_summary, student info, etc.)
 * @param student - The student object (for name/email)
 * @param isFirstInvoice - Whether this is the first invoice for the student
 * @returns The public URL of the uploaded PDF
 */
export async function generateAndUploadInvoicePDF(invoice: any, student: any, isFirstInvoice: boolean = false): Promise<string> {
  // Prepare invoice details for PDF
  const invoiceDetails = invoice.lessons_summary;
  const quoteData = {
    name: student.student_name,
    email: student.email,
    phone: student.phone || '',
    service_category: 'Music Lessons',
    project_type: '',
    event_date: '',
    location: '',
    budget_range: '',
    timeline: '',
    specific_requirements: '',
    reference_materials_url: '',
    status: '',
    admin_notes: '',
    quote_amount: invoice.amount_due,
    quote_sent_at: '',
    preferred_contact_method: 'email',
    additional_notes: ''
  };

  // Debug: log due date before passing to PDF
  console.log('PDF Generation: invoice.due_date =', invoice.due_date);
  // Build invoiceMeta for the new PDF layout
  const invoiceMeta = {
    invoiceNumber: isFirstInvoice ? 'first' : invoice.id || '',
    periodStart: invoice.period_start || '',
    periodEnd: invoice.period_end || '',
    dueDate: invoice.due_date || '',
    paymentStatus: invoice.status ? invoice.status.toUpperCase() : 'PENDING',
    studentId: student.id || '',
    registrationId: student.registration_id || '',
    sessionsPerWeek: invoice.sessions_per_week || undefined,
    notes: invoice.notes || '',
  };
  // Debug: log invoiceMeta before PDF generation
  console.log('PDF Generation: invoiceMeta =', invoiceMeta);

  // Generate PDF blob with new layout
  const pdfBlob = await generateQuotePDF(quoteData, invoice.amount_due, '', invoiceDetails, invoiceMeta);
  // Upload to Supabase Storage
  const fileName = `invoices/${student.id}_${invoice.period_start}_${invoice.period_end}.pdf`;
  const { data, error } = await supabase.storage.from('invoices').upload(fileName, pdfBlob, { upsert: true, contentType: 'application/pdf' });
  if (error) throw error;
  // Get public URL
  const { publicUrl } = supabase.storage.from('invoices').getPublicUrl(fileName).data;
  return publicUrl;
}

// Add defensive check utility function
const isValidId = (id: any) => id && id !== 'undefined' && id !== undefined && id !== null;

/**
 * Generate an invoice for a given registration.
 * @param registrationId - The registration UUID
 * @returns The created Invoice object
 */
export async function generateInvoiceForRegistration(registrationId: string): Promise<Invoice | null | { existing: Invoice }> {
  // Defensive check for registration ID
  if (!isValidId(registrationId)) {
    console.error('Invalid registration ID for invoice generation:', registrationId);
    throw new Error('Invalid registration ID');
  }

  // Fetch registration, student, and fee info
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', registrationId)
    .single();
  if (regError || !registration) throw regError || new Error('Registration not found');

  // Find the student for this registration using registration_id
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('registration_id', registrationId)
    .single();
  
  if (studentError || !student) {
    console.error('Student not found for registration:', registrationId);
    throw new Error('Student not found for registration');
  }

  // Defensive check for student ID
  if (!isValidId(student.id)) {
    console.error('Student missing valid ID:', student);
    throw new Error('Student missing valid ID');
  }

  // Find the matching fee with proper fallback logic based on student preferences
  let fee = null;
  let feeError = null;
  
  // Get student preferences from registration
  const learningMode = registration.learning_mode || 'in-person';
  const courseCategory = registration.course_category || 'Music';
  const instrument = registration.instrument;
  
  console.log('Looking for fee with preferences:', {
    courseCategory,
    instrument,
    learningMode
  });
  
  // Determine payment type based on course category
  let paymentType = 'monthly'; // Default
  if (courseCategory === 'production' || courseCategory === 'photography') {
    paymentType = 'term';
  } else if (courseCategory === 'Technology') {
    paymentType = 'per_class'; // Technology courses use per_class billing
  }
  
  console.log('Determined payment type:', paymentType, 'for course category:', courseCategory);
  
  // Normalize learning mode for database matching
  const normalizeLearningMode = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'online':
        return 'Online (Global)';
      case 'home':
      case 'home (nakuru & environs)':
        return 'Home (Nakuru & Environs)';
      case 'in-person':
      case 'at the academy':
        return 'At the Academy';
      default:
        return mode;
    }
  };
  
  const normalizedLearningMode = normalizeLearningMode(learningMode);
  console.log('Normalized learning mode:', normalizedLearningMode);
  
  let normalizedCourseCategory = (courseCategory || '').toLowerCase();
  let normalizedInstrument = instrument;
  if (normalizedCourseCategory === 'art') {
    normalizedCourseCategory = 'art';
    normalizedInstrument = 'Art Classes'; // canonical name for art in fees table
  } else if (normalizedCourseCategory === 'technology') {
    normalizedCourseCategory = 'technology';
    // For technology courses, always use 'Web Design & Programming' as the course name
    // This ensures we find the correct Technology fee
    normalizedInstrument = 'Web Design & Programming';
  }
  
  // First try to find exact match with normalized learning mode and correct payment type
  const { data: exactFee, error: exactFeeError } = await supabase
    .from('fees')
    .select('*')
    .eq('course_type', normalizedCourseCategory)
    .eq('course_name', normalizedInstrument)
    .eq('mode', normalizedLearningMode)
    .eq('payment_type', paymentType)
    .eq('is_active', true)
    .maybeSingle();
  
  if (exactFee && !exactFeeError) {
    fee = exactFee;
    console.log('Found exact fee match with learning mode and payment type:', fee);
  } else {
    console.log('No exact fee match found, trying fallback options');
    
    // Fallback 1: Try to find by course_type and normalized learning_mode with correct payment type
    const { data: modeFee, error: modeFeeError } = await supabase
      .from('fees')
      .select('*')
      .eq('course_type', normalizedCourseCategory)
      .eq('mode', normalizedLearningMode)
      .eq('payment_type', paymentType)
      .eq('is_active', true)
      .maybeSingle();
    
    if (modeFee && !modeFeeError) {
      fee = modeFee;
      console.log('Found fee by course_type and learning_mode with payment type:', fee);
    } else {
      // Fallback 2: Try to find by course_type only with correct payment type
      const { data: typeFee, error: typeFeeError } = await supabase
        .from('fees')
        .select('*')
        .eq('course_type', normalizedCourseCategory)
        .eq('payment_type', paymentType)
        .eq('is_active', true)
        .maybeSingle();
      
      if (typeFee && !typeFeeError) {
        fee = typeFee;
        console.log('Found fee by course_type only with payment type:', fee);
      } else {
        // Fallback 3: For Technology courses, prioritize 1-on-1 fee
        if (normalizedCourseCategory === 'technology' && paymentType === 'per_class') {
          const { data: techFee, error: techFeeError } = await supabase
            .from('fees')
            .select('*')
            .eq('course_type', 'technology')
            .eq('course_name', 'Web Design & Programming')
            .eq('payment_type', 'per_class')
            .eq('is_active', true)
            .order('price', { ascending: false }) // Get highest price (1-on-1) first
            .limit(1)
            .maybeSingle();
          
          if (techFee && !techFeeError) {
            fee = techFee;
            console.log('Found Technology 1-on-1 fee:', fee);
          }
        } else if (paymentType === 'term') {
          // Fallback 4: For termly courses, try to find any term fee for the course category
          const { data: termFee, error: termFeeError } = await supabase
            .from('fees')
            .select('*')
            .eq('course_type', normalizedCourseCategory)
            .eq('payment_type', 'term')
            .eq('is_active', true)
            .maybeSingle();
          
          if (termFee && !termFeeError) {
            fee = termFee;
            console.log('Found term fee for course category:', fee);
          }
        }
        
        // Fallback 5: Try to find any fee for the normalized learning mode with correct payment type
        if (!fee) {
          const { data: modeAnyFee, error: modeAnyFeeError } = await supabase
            .from('fees')
            .select('*')
            .eq('mode', normalizedLearningMode)
            .eq('payment_type', paymentType)
            .eq('is_active', true)
            .maybeSingle();
          
          if (modeAnyFee && !modeAnyFeeError) {
            fee = modeAnyFee;
            console.log('Found fee for learning mode with payment type:', fee);
          }
        }
        
        // Fallback 6: Try to find any active fee with correct payment type
        if (!fee) {
          const { data: anyFee, error: anyFeeError } = await supabase
            .from('fees')
            .select('*')
            .eq('payment_type', paymentType)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          
          if (anyFee && !anyFeeError) {
            fee = anyFee;
            console.log('Found fallback fee with payment type:', fee);
          }
        }
        
        // Fallback 6: If still no fee found, fetch all active fees to get real rates
        if (!fee) {
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
            bestMatch = allFees.find(f => f.course_type === normalizedCourseCategory);
            
            // If no match by course category, find by payment type
            if (!bestMatch) {
              bestMatch = allFees.find(f => f.payment_type === paymentType);
            }
            
            // If still no match, use the first available fee
            if (!bestMatch) {
              bestMatch = allFees[0];
            }
            
            fee = bestMatch;
            console.log('Using real fee from database as fallback:', fee);
          }
        }
        
        // Fallback 7: Last resort - create a default fee structure based on real market rates
        if (!fee) {
          console.log('No fees found in database, creating default fee structure');
          let defaultPrice = 5000; // Default in KES
          let defaultCurrency = 'KSh';
          
          if (paymentType === 'term') {
            // Termly courses (production, photography) - higher rates
            if (normalizedCourseCategory === 'production') {
              defaultPrice = 45500; // KES 45,500 for production term
            } else if (normalizedCourseCategory === 'photography') {
              defaultPrice = 45500; // KES 45,500 for photography term
            } else {
              defaultPrice = 40000; // KES 40,000 for other termly courses
            }
          } else if (learningMode === 'online') {
            defaultPrice = 44; // $44 USD
            defaultCurrency = '$';
          } else if (learningMode === 'home') {
            defaultPrice = 10000; // KES 10,000 for home lessons
          } else {
            defaultPrice = 4800; // KES 4,800 for academy lessons
          }
          
          fee = {
            id: 'default',
            course_type: normalizedCourseCategory,
            course_name: normalizedInstrument,
            price: defaultPrice,
            currency: defaultCurrency,
            payment_type: paymentType,
            mode: learningMode,
            sessions_per_week: paymentType === 'term' ? 3 : 1,
            is_active: true
          };
          console.log('Using default fee structure based on real market rates:', fee);
        }
      }
    }
  }
  
  if (!fee) {
    console.error('No fee found and could not create default fee');
    throw new Error('Fee not found for registration and no fallback available');
  }
  
  // Convert foreign currency to KES using real-time exchange rates
  console.log('💰 Currency conversion check:', {
    feeCurrency: fee.currency,
    feePrice: fee.price,
    needsConversion: fee.currency && fee.currency !== 'KSh' && fee.price
  });
  
  if (fee.currency && fee.currency !== 'KSh' && fee.price) {
    try {
      const exchangeRate = await getCachedExchangeRate(fee.currency, 'KES');
      const originalPrice = fee.price;
      fee.price = Math.round(fee.price * exchangeRate * 100) / 100; // Round to 2 decimal places
      fee.currency = 'KSh';
      console.log(`✅ Converted ${originalPrice} ${fee.currency} to KES: ${fee.price} KSh (rate: 1 ${fee.currency} = ${exchangeRate} KES)`);
    } catch (error) {
      console.error('❌ Error converting currency:', error);
      // Use 128 as fallback rate as requested
      const fallbackRate = 128;
      fee.price = Math.round(fee.price * fallbackRate * 100) / 100;
      fee.currency = 'KSh';
      console.log(`🔄 Used fallback rate for ${fee.currency}: ${fee.price} KSh`);
    }
  }

  // Determine billing period
  const now = new Date();
  let periodStart: Date, periodEnd: Date;
  
  // Check if this is the first invoice for this student
  const { data: existingInvoices, error: existingInvoicesError } = await supabase
    .from('invoices')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: true });
  
  if (existingInvoicesError) {
    console.error('Error checking existing invoices:', existingInvoicesError);
    throw existingInvoicesError;
  }
  
  const isFirstInvoice = !existingInvoices || existingInvoices.length === 0;
  
  console.log('📅 Billing period calculation:', {
    isFirstInvoice,
    existingInvoicesCount: existingInvoices?.length || 0,
    currentDate: now.toISOString().slice(0, 10),
    paymentType: fee.payment_type
  });
  
  if (fee.payment_type === 'monthly' || fee.payment_type === 'per_class') {
    if (isFirstInvoice) {
      // First invoice: Full current month (1st to last day of enrollment month)
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    } else {
      // Subsequent invoices: Next month billing period
      const lastInvoice = existingInvoices[existingInvoices.length - 1];
      const lastPeriodEnd = new Date(lastInvoice.period_end);
      
      // Next billing period starts the month after the last invoice
      periodStart = new Date(lastPeriodEnd.getFullYear(), lastPeriodEnd.getMonth() + 1, 1);
      periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
    }
  } else if (fee.payment_type === 'term') {
    if (isFirstInvoice) {
      // First term: From registration date to 3 months later
      periodStart = new Date(registration.created_at);
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 3);
      periodEnd.setDate(periodEnd.getDate() - 1);
    } else {
      // Subsequent terms: 3-month periods after the last term
      const lastInvoice = existingInvoices[existingInvoices.length - 1];
      const lastPeriodEnd = new Date(lastInvoice.period_end);
      periodStart = new Date(lastPeriodEnd);
      periodStart.setDate(periodStart.getDate() + 1);
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 3);
      periodEnd.setDate(periodEnd.getDate() - 1);
    }
    // Due date should be 7th of the next month after periodEnd
  } else {
    throw new Error('Unsupported payment type');
  }
  const periodStartStr = periodStart.toISOString().slice(0, 10);
  const periodEndStr = periodEnd.toISOString().slice(0, 10);

  // Calculate due_date based on invoice type
  let dueDateObj: Date;
  if (isFirstInvoice) {
    // First invoice: Due date is the last day of the enrollment month (regardless of payment type)
    dueDateObj = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), periodEnd.getDate());
  } else {
    // Subsequent invoices: Due date is 7th of the month after periodEnd at midnight GMT+3
    // GMT+3 = UTC+3, so midnight GMT+3 = 21:00 UTC (previous day)
    dueDateObj = new Date(Date.UTC(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 6, 21, 0, 0, 0));
  }
  const dueDateStr = dueDateObj.toISOString().slice(0, 10);

  // Check for existing invoice for this student/period (temporarily without registration_id)
  const { data: existingInvoice, error: existingError } = await supabase
    .from('invoices')
    .select('*')
    .eq('student_id', student.id)
    .eq('period_start', periodStartStr)
    .eq('period_end', periodEndStr)
    .maybeSingle();
  
  if (existingError) {
    console.error('Error checking for existing invoice:', existingError);
    throw existingError;
  }
  
  if (existingInvoice) {
    console.log('Existing invoice found:', existingInvoice);
    return { existing: existingInvoice }; // Already exists, return existing
  }

  // --- Makeup Credits Enforcement Logic ---
  // 1. Find the previous invoice for this student (by period_end < current period_start)
  const { data: prevInvoice, error: prevInvError } = await supabase
    .from('invoices')
    .select('*')
    .eq('student_id', student.id)
    .lt('period_end', periodStartStr)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (prevInvError) {
    console.error('Error checking for previous invoice:', prevInvError);
    throw prevInvError;
  }

  let creditsApplied = 0;
  let creditsValue = 0;
  let makeupCreditIds: string[] = [];
  let notes = null;
  console.log('🔍 Fee found for invoice generation:', {
    feeId: fee.id,
    feePrice: fee.price,
    feeCurrency: fee.currency,
    feePaymentType: fee.payment_type,
    feeMode: fee.mode,
    feeCourseType: fee.course_type,
    feeCourseName: fee.course_name
  });

  // Get number of sessions per week from registration (default 1)
  const sessionsPerWeek = registration.sessions_per_week ? parseInt(registration.sessions_per_week) : 1;

  // Declare invoiceAmount
  let invoiceAmount = 0;
  
  if (fee.payment_type === 'per_class') {
    // For per_class payment type (Technology courses): price × sessions_per_week × 4 weeks
    const numWeeks = 4; // Always 4 weeks for monthly billing
    invoiceAmount = fee.price * sessionsPerWeek * numWeeks;
    console.log('Per-class billing calculation:', {
      pricePerClass: fee.price,
      sessionsPerWeek,
      numWeeks,
      totalAmount: invoiceAmount
    });
  } else if (fee && fee.sessions_per_week) {
    // If the fee has a sessions_per_week column, use it for matching
    // If the fee is for 1 session/week, multiply by sessionsPerWeek
    if (fee.sessions_per_week === 1) {
      invoiceAmount = fee.price * sessionsPerWeek;
    } else {
      // If the fee is for the same number of sessions as requested, use the fee as-is
      if (fee.sessions_per_week === sessionsPerWeek) {
        invoiceAmount = fee.price;
      } else {
        // If the fee is for a different number of sessions, scale proportionally
        invoiceAmount = (fee.price / fee.sessions_per_week) * sessionsPerWeek;
      }
    }
  } else {
    // Fallback: if no sessions_per_week info, multiply as before
    invoiceAmount = fee.price * sessionsPerWeek;
  }
  
  if (!fee.price || fee.price <= 0) {
    console.error('❌ Fee has invalid price:', fee.price);
    throw new Error(`Fee has invalid price: ${fee.price}`);
  }

  // Only apply credits if previous invoice is paid (or if this is the first invoice)
  let canApplyCredits = false;
  if (!prevInvoice) {
    canApplyCredits = true; // First invoice, allow credits (if you want to, or set to false to never apply on first)
  } else if (prevInvoice.status === 'paid') {
    canApplyCredits = true;
  }

  if (canApplyCredits) {
    // Fetch unused, unexpired makeup credits for this student
    const { data: credits, error: creditsError } = await supabase
      .from('makeup_credits')
      .select('*')
      .eq('student_id', student.id)
      .eq('is_used', false)
      .gte('expires_at', periodStartStr);
    if (creditsError) throw creditsError;
    if (credits && credits.length > 0) {
      // Each credit = 1 session, value = session price (fee.price / expected sessions per month/term)
      const sessionValue = Math.round((fee.price / sessionsPerWeek) * 100) / 100;
      creditsApplied = credits.length;
      creditsValue = Math.min(creditsApplied * sessionValue, invoiceAmount);
      invoiceAmount = Math.max(0, invoiceAmount - creditsValue);
      makeupCreditIds = credits.slice(0, Math.floor(creditsValue / sessionValue)).map(c => c.id);
      notes = `Applied ${makeupCreditIds.length} makeup credit(s) worth KES ${creditsValue.toLocaleString()} to this invoice.`;
    }
  }

  // Calculate number of weeks in the invoice period
  // For monthly billing and per_class (Technology), use exactly 4 weeks (28 days) regardless of actual month length
  let numWeeks: number;
  if (fee.payment_type === 'monthly' || fee.payment_type === 'per_class') {
    numWeeks = 4; // Always 4 weeks for monthly billing and Technology per_class billing
  } else {
    // For term billing, calculate actual weeks
    const daysDiff = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    numWeeks = Math.ceil(daysDiff / 7);
  }
  const quantity = sessionsPerWeek * numWeeks;
  
  // Calculate unit price per session
  let unitPrice: number;
  if (fee.payment_type === 'per_class') {
    // For per_class, unit price is the fee price directly
    unitPrice = fee.price;
  } else {
    // For monthly/term, calculate based on total amount and quantity
    unitPrice = Math.round((invoiceAmount / quantity) * 100) / 100;
  }
  
  // Apply partial month billing logic for subsequent invoices (only for monthly payment type, not Technology)
  if (!isFirstInvoice && fee.payment_type === 'monthly' && courseCategory !== 'Technology') {
    // For subsequent invoices, check if student enrolled mid-month in the first month
    const registrationDate = new Date(registration.created_at);
    const firstMonthStart = new Date(registrationDate.getFullYear(), registrationDate.getMonth(), 1);
    
    // If student enrolled after the 1st of their enrollment month, calculate partial billing
    if (registrationDate.getDate() > 1) {
      const daysBeforeEnrollment = registrationDate.getDate() - 1;
      const sessionsBeforeEnrollment = Math.ceil((daysBeforeEnrollment / 7) * sessionsPerWeek);
      const deductionAmount = sessionsBeforeEnrollment * unitPrice;
      
      // Deduct the amount for sessions before enrollment
      invoiceAmount = Math.max(0, invoiceAmount - deductionAmount);
      
      // Update notes to reflect the deduction
      if (notes) {
        notes += ` Deducted KES ${deductionAmount.toLocaleString()} for ${sessionsBeforeEnrollment} sessions before enrollment date.`;
      } else {
        notes = `Deducted KES ${deductionAmount.toLocaleString()} for ${sessionsBeforeEnrollment} sessions before enrollment date.`;
      }
      
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

  // Add application fee for first invoice only
  const applicationFee = isFirstInvoice ? 800 : 0;
  const totalAmount = invoiceAmount + applicationFee;

  // Get the actual instrument/course name for display
  const getCourseDisplayName = () => {
    if (registration.course_category === 'Art') {
      return 'Art Classes';
    } else if (registration.course_category === 'Production') {
      return registration.production_type || 'Production';
    } else if (registration.course_category === 'Technology') {
      return registration.technology_type || 'Technology';
    } else {
      return registration.instrument || 'Music Lessons';
    }
  };

  const courseDisplayName = getCourseDisplayName();

  // Build invoiceDetails for PDF with detailed breakdown
  const invoiceDetails = {
    lineItems: [
      {
        description: `${courseDisplayName} - ${sessionsPerWeek} session${sessionsPerWeek > 1 ? 's' : ''} per week × ${numWeeks} weeks`,
        quantity,
        unitPrice,
        amount: invoiceAmount,
        lessonIds: [],
      },
      ...(isFirstInvoice ? [{
        description: 'Application Fee (One-time, non-refundable enrollment fee)',
        quantity: 1,
        unitPrice: applicationFee,
        amount: applicationFee,
        lessonIds: [],
      }] : [])
    ],
    subtotal: totalAmount,
    tax: 0, // Remove tax as requested
    total: totalAmount,
    paymentTerms: 'Payment due within 7 days of invoice date',
    validUntil: '',
    serviceBreakdown: `${courseDisplayName} as scheduled`,
    equipmentBreakdown: 'All necessary equipment and materials provided',
    additionalInfo: notes || 'Please contact us if you have any questions about this invoice.'
  };

  // Prepare invoice data (using current schema with student_id only)
  const invoiceData: any = {
    student_id: student.id,
    amount_due: totalAmount, // Use total amount including application fee
    period_start: periodStartStr,
    period_end: periodEndStr,
    due_date: dueDateStr,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sessions_per_week: sessionsPerWeek,
    lessons_summary: invoiceDetails, // Store the detailed breakdown
  };
  
  // Add optional fields if they exist in the schema
  if (fee.id) {
    invoiceData.fee_id = fee.id;
  }
  invoiceData.is_auto_generated = true;
  invoiceData.admin_override = false;
  invoiceData.notes = notes;

  console.log('Creating invoice with data:', invoiceData);

  // Insert invoice
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .insert([invoiceData])
    .select('*')
    .single();
  
  if (invError) {
    console.error('Error creating invoice:', invError);
    throw invError;
  }

  console.log('Invoice created successfully:', invoice);

  // Mark applied credits as used and associate with this invoice
  if (makeupCreditIds.length > 0 && invoice) {
    await supabase
      .from('makeup_credits')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .in('id', makeupCreditIds);
  }

  return invoice as Invoice;
}

/**
 * Generate recurring invoices for all active registrations.
 * Should be run as a scheduled job (e.g., monthly/termly).
 */
export async function generateRecurringInvoices(): Promise<void> {
  // Fetch all active registrations
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('status', 'approved');
  if (error) throw error;
  if (!registrations) return;

  const summary = { created: 0, skipped: 0, reminders: 0, errors: 0 };

  for (const reg of registrations) {
    try {
      const result = await generateInvoiceForRegistration(reg.id);
      if (result && 'existing' in result) {
        const invoice = result.existing;
        // Defensive check for student_id before fetching student
        if (!isValidId(reg.student_id)) {
          console.error('Registration missing valid student_id for email:', reg);
          summary.errors++;
          continue;
        }
        // Fetch student for email
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', reg.student_id)
          .single();
        if (student && !studentError && invoice.status !== 'paid') {
          await sendInvoiceEmail(invoice, student, { isReminder: true, isFirstInvoice: false });
          summary.reminders++;
        } else {
          summary.skipped++;
        }
      } else if (result) {
        const invoice = result as Invoice;
        // Defensive check for student_id before fetching student
        if (!isValidId(reg.student_id)) {
          console.error('Registration missing valid student_id for email:', reg);
          summary.errors++;
          continue;
        }
        // Fetch student for email
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', reg.student_id)
          .single();
        if (student && !studentError) {
          await sendInvoiceEmail(invoice, student, { isFirstInvoice: false });
        }
        summary.created++;
      } else {
        summary.skipped++;
      }
    } catch (err) {
      console.error(`Failed to generate/send invoice for registration ${reg.id}:`, err);
      summary.errors++;
    }
  }
  console.log('Recurring invoice generation summary:', summary);
} 

/**
 * Test function to check current exchange rates
 * This can be used for debugging or to verify rates are working
 */
export async function testExchangeRates(): Promise<void> {
  console.log('🧪 Testing Exchange Rates...');
  
  const currencies = ['USD', 'EUR', 'GBP'];
  
  for (const currency of currencies) {
    try {
      const rate = await getCachedExchangeRate(currency, 'KES');
      console.log(`✅ ${currency} to KES: 1 ${currency} = ${rate} KES`);
    } catch (error) {
      console.error(`❌ Failed to get ${currency} to KES rate:`, error);
    }
  }
  
  // Test some sample conversions
  const testAmounts = [
    { amount: 44, currency: 'USD' },
    { amount: 50, currency: 'EUR' },
    { amount: 30, currency: 'GBP' }
  ];
  
  for (const test of testAmounts) {
    try {
      const rate = await getCachedExchangeRate(test.currency, 'KES');
      const converted = Math.round(test.amount * rate * 100) / 100;
      console.log(`💰 ${test.amount} ${test.currency} = ${converted} KES`);
    } catch (error) {
      console.error(`❌ Failed to convert ${test.amount} ${test.currency}:`, error);
    }
  }
}

/**
 * Get current exchange rate for a specific currency pair
 * @param fromCurrency - Source currency (e.g., 'USD')
 * @param toCurrency - Target currency (e.g., 'KES')
 * @returns Current exchange rate
 */
export async function getCurrentExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  return await getCachedExchangeRate(fromCurrency, toCurrency);
} 