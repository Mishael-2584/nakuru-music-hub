/**
 * Booking Restrictions Utility
 * Centralized logic for enforcing account restrictions on class bookings
 */

import { supabase } from '@/integrations/supabase/client';

export interface StudentAccessStatus {
  canBook: boolean;
  reason?: string;
  severity: 'blocked' | 'warning' | 'ok';
  actionRequired?: string;
}

export interface StudentAccountInfo {
  id: string;
  account_suspended?: boolean;
  suspension_reason?: string | null;
  is_access_suspended?: boolean; // Legacy field
}

/**
 * Check if a student can book classes
 * @param student - Student account information
 * @returns Access status with reason if blocked
 */
export function checkBookingEligibility(student: StudentAccountInfo): StudentAccessStatus {
  // Only check for account suspension
  if (student.account_suspended || student.is_access_suspended) {
    return {
      canBook: false,
      reason: student.suspension_reason || 'Your account has been suspended. Please contact administration.',
      severity: 'blocked',
      actionRequired: 'Contact admin at info@damonmusicacademy.co.ke or call +254 701 195 460 or +254 713 490 535'
    };
  }

  // Account is active - allow booking
  return {
    canBook: true,
    severity: 'ok'
  };
}

/**
 * Fetch current student access status from database
 * @param userId - Auth user ID
 * @returns Student access status or null if not found
 */
export async function fetchStudentAccessStatus(userId: string): Promise<StudentAccountInfo | null> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, account_suspended, suspension_reason, is_access_suspended')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching student access status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching student access status:', error);
    return null;
  }
}

/**
 * Validate booking attempt and return user-friendly error if blocked
 * @param student - Student account information
 * @returns Object with success flag and message
 */
export function validateBookingAttempt(student: StudentAccountInfo): {
  success: boolean;
  title: string;
  message: string;
  variant?: 'default' | 'destructive';
} {
  const eligibility = checkBookingEligibility(student);

  if (!eligibility.canBook) {
    return {
      success: false,
      title: eligibility.severity === 'blocked' ? '🚫 Booking Not Allowed' : 'Access Restricted',
      message: `${eligibility.reason}\n\n${eligibility.actionRequired || ''}`,
      variant: 'destructive'
    };
  }

  return {
    success: true,
    title: 'Success',
    message: 'You can proceed with booking'
  };
}

/**
 * Get user-friendly status message for UI display
 * @param student - Student account information
 * @returns Status message and icon suggestion
 */
export function getAccountStatusMessage(student: StudentAccountInfo): {
  message: string;
  icon: 'ban' | 'lock' | 'alert' | 'check';
  color: 'red' | 'yellow' | 'blue' | 'green';
} {
  if (student.account_suspended || student.is_access_suspended) {
    return {
      message: 'Account Suspended - No Access',
      icon: 'ban',
      color: 'red'
    };
  }

  return {
    message: 'Account Active - Full Access',
    icon: 'check',
    color: 'green'
  };
}

/**
 * Check if student has any unpaid invoices
 * @param studentId - Student database ID
 * @returns Number of unpaid invoices
 */
export async function getUnpaidInvoiceCount(studentId: string): Promise<number> {
  try {
    const { data, error, count } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .in('status', ['pending', 'overdue']);

    if (error) {
      console.error('Error counting unpaid invoices:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Exception counting unpaid invoices:', error);
    return 0;
  }
}

