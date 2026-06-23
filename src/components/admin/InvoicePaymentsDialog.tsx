import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InvoicePaymentsPanel } from '@/components/admin/InvoicePaymentsPanel';
import { formatInvoiceBillingMonth } from '@/lib/invoiceNaming';
import { isInvoiceFullyPaid } from '@/lib/invoiceUtils';

type InvoiceLike = {
  id: string;
  period_start?: string | null;
  period_end?: string | null;
  amount_due?: number | null;
  manual_amount_due?: number | null;
  manual_amount_override?: number | null;
  amount_paid?: number | null;
  payment_status?: string | null;
  status?: string | null;
  updated_at?: string | null;
};

type StudentLike = {
  id: string;
  student_name?: string | null;
  email?: string | null;
  phone?: string | null;
};

interface InvoicePaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceLike | null;
  student: StudentLike | null;
  onDownloadInvoicePdf?: () => void;
  onRecordPayment?: () => void;
  downloadingInvoicePdf?: boolean;
  refreshKey?: string | number;
}

export function InvoicePaymentsDialog({
  open,
  onOpenChange,
  invoice,
  student,
  onDownloadInvoicePdf,
  onRecordPayment,
  downloadingInvoicePdf,
  refreshKey,
}: InvoicePaymentsDialogProps) {
  if (!invoice || !student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payments &amp; receipts</DialogTitle>
          <DialogDescription>
            {student.student_name} — {formatInvoiceBillingMonth(invoice)}
          </DialogDescription>
        </DialogHeader>

        <InvoicePaymentsPanel
          invoice={invoice}
          student={student}
          refreshKey={refreshKey ?? invoice.updated_at ?? invoice.id}
        />

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {onDownloadInvoicePdf && (
            <Button
              variant="outline"
              disabled={downloadingInvoicePdf}
              onClick={onDownloadInvoicePdf}
            >
              {downloadingInvoicePdf ? 'Generating invoice PDF…' : 'Download invoice PDF'}
            </Button>
          )}
          {onRecordPayment && !isInvoiceFullyPaid(invoice) && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={onRecordPayment}>
              Record payment
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
