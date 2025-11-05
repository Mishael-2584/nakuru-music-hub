import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Ban, Lock, AlertCircle, CheckCircle, CreditCard, MessageSquare, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface StudentAccountStatusBannerProps {
  student: {
    account_suspended?: boolean;
    suspension_reason?: string | null;
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

  // If account is suspended, show critical alert
  if (isSuspended) {
    return (
      <Alert variant="destructive" className="mb-6 border-2 border-red-500 bg-red-50">
        <Ban className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">Account Suspended</AlertTitle>
        <AlertDescription>
          <p className="mb-2 font-semibold">
            Your account has been suspended and you cannot access classes or booking features.
          </p>
          {student.suspension_reason && (
            <div className="bg-red-100 border border-red-300 p-3 rounded mt-3">
              <p className="text-sm font-semibold mb-1">Reason for Suspension:</p>
              <p className="text-sm">{student.suspension_reason}</p>
            </div>
          )}
          <div className="bg-red-100 border border-red-300 p-3 rounded mt-3">
            <p className="text-sm font-semibold mb-2">🚫 What you cannot do:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Book new classes or sessions</li>
              <li>Attend scheduled lessons</li>
              <li>Access classroom resources</li>
              <li>Join video conference calls</li>
            </ul>
          </div>
          <div className="bg-white border border-red-300 p-3 rounded mt-3">
            <p className="text-sm font-semibold mb-2">📞 How to restore your account:</p>
            <p className="text-sm mb-2">
              Please contact the academy administration to resolve this issue and restore your access.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button size="sm" variant="outline" asChild className="bg-white border-red-300 hover:bg-red-50">
                <a href="mailto:info@damonmusicacademy.co.ke">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Email Admin
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild className="bg-white border-red-300 hover:bg-red-50">
                <a href="tel:+254701195460">
                  <Clock className="h-3 w-3 mr-1" />
                  Call: +254 701 195 460
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild className="bg-white border-red-300 hover:bg-red-50">
                <a href="tel:+254713490535">
                  <Clock className="h-3 w-3 mr-1" />
                  Call: +254 713 490 535
                </a>
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // If account is active, optionally show unpaid invoice reminder
  if (unpaidInvoiceCount > 0) {
    return (
      <Alert className="mb-6 border-2 border-yellow-400 bg-yellow-50">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-lg font-bold text-yellow-800">
          Unpaid Invoices
        </AlertTitle>
        <AlertDescription className="text-yellow-700">
          <p>
            You have {unpaidInvoiceCount} unpaid invoice{unpaidInvoiceCount > 1 ? 's' : ''}. 
            Please check your Invoices tab and settle your balance to avoid any service interruption.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Account is active - no alert needed
  return null;
}

