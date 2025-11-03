import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Ban, Lock, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface StudentAccountStatusBannerProps {
  student: {
    account_suspended?: boolean;
    suspension_reason?: string | null;
    first_invoice_paid?: boolean;
    can_book_classes?: boolean;
    is_access_suspended?: boolean; // Legacy field
  };
  unpaidInvoiceCount?: number;
}

export default function StudentAccountStatusBanner({ 
  student, 
  unpaidInvoiceCount = 0 
}: StudentAccountStatusBannerProps) {
  // Check for account suspension (either new or legacy field)
  const isSuspended = student.account_suspended || student.is_access_suspended;
  
  // Check for first invoice payment requirement
  const needsFirstPayment = !student.first_invoice_paid && !student.can_book_classes;

  // If account is suspended, show critical alert
  if (isSuspended) {
    return (
      <Alert variant="destructive" className="mb-6 border-2 border-red-500 bg-red-50">
        <Ban className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">Account Suspended</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            Your account has been suspended and you cannot access classes or booking features.
          </p>
          {student.suspension_reason && (
            <p className="text-sm bg-red-100 p-2 rounded mt-2">
              <strong>Reason:</strong> {student.suspension_reason}
            </p>
          )}
          <p className="mt-3 text-sm">
            Please contact the academy administration for assistance or to resolve this issue.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" asChild className="bg-white">
              <a href="mailto:info@damonmusicacademy.co.ke">
                Contact Admin
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild className="bg-white">
              <a href="tel:+254701195460">
                Call Us
              </a>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // If first invoice needs payment, show warning
  if (needsFirstPayment) {
    return (
      <Alert className="mb-6 border-2 border-yellow-400 bg-yellow-50">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-lg font-bold text-yellow-800">
          Payment Required to Access Classes
        </AlertTitle>
        <AlertDescription className="text-yellow-700">
          <p className="mb-2">
            <strong>Important:</strong> Your first invoice must be paid before you can book or attend classes. 
            This is a mandatory requirement to activate your full student access.
          </p>
          <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mt-3">
            <p className="text-sm font-semibold mb-2">⚠️ What you can't do until payment:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Book new classes or sessions</li>
              <li>Attend scheduled lessons</li>
              <li>Access classroom resources</li>
              <li>Join video conference calls</li>
            </ul>
          </div>
          <p className="mt-3 text-sm">
            Please check the <strong>Invoices</strong> tab below to view and pay your first invoice. 
            Once payment is confirmed by admin, you'll have full access immediately.
          </p>
          <div className="mt-3">
            <Badge className="bg-yellow-600 hover:bg-yellow-700 cursor-pointer">
              <CreditCard className="h-3 w-3 mr-1" />
              {unpaidInvoiceCount > 0 ? `${unpaidInvoiceCount} Unpaid Invoice${unpaidInvoiceCount > 1 ? 's' : ''}` : 'Check Invoices Tab'}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // If account is active and first invoice is paid, show success
  if (student.first_invoice_paid && student.can_book_classes) {
    return (
      <Alert className="mb-6 border-2 border-green-400 bg-green-50">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-lg font-bold text-green-800">
          Account Active - Full Access
        </AlertTitle>
        <AlertDescription className="text-green-700">
          <p>
            ✅ Your account is fully active! You can book classes, attend sessions, and access all student features.
            {unpaidInvoiceCount > 0 && (
              <span className="block mt-2 text-yellow-700">
                <strong>Note:</strong> You have {unpaidInvoiceCount} unpaid invoice{unpaidInvoiceCount > 1 ? 's' : ''}. 
                Please settle to avoid service interruption.
              </span>
            )}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Fallback - limited access
  return (
    <Alert className="mb-6 border-2 border-blue-400 bg-blue-50">
      <Lock className="h-5 w-5 text-blue-600" />
      <AlertTitle className="text-lg font-bold text-blue-800">
        Limited Access
      </AlertTitle>
      <AlertDescription className="text-blue-700">
        <p>
          Your account has limited access. Please ensure your first invoice is paid to unlock all features.
        </p>
      </AlertDescription>
    </Alert>
  );
}

