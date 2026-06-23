import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchInvoicePayments,
  getEffectiveAmountDue,
  getInvoiceAmountPaid,
  getInvoiceBalanceRemaining,
  type InvoicePaymentRow,
} from '@/lib/invoiceUtils';
import { downloadPaymentReceiptPDF } from '@/lib/paymentReceiptUtils';
import { useToast } from '@/hooks/use-toast';

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
};

type StudentLike = {
  id: string;
  student_name?: string | null;
  email?: string | null;
  phone?: string | null;
};

interface InvoicePaymentsPanelProps {
  invoice: InvoiceLike;
  student: StudentLike;
  refreshKey?: string | number;
  compact?: boolean;
}

export function InvoicePaymentsPanel({
  invoice,
  student,
  refreshKey,
  compact = false,
}: InvoicePaymentsPanelProps) {
  const { toast } = useToast();
  const [payments, setPayments] = useState<InvoicePaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    if (!invoice?.id) {
      setPayments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchInvoicePayments(invoice.id);
      setPayments(rows);
    } catch (err) {
      console.error('InvoicePaymentsPanel load:', err);
      toast({
        title: 'Could not load payments',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [invoice?.id, toast]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments, refreshKey]);

  const handleDownloadReceipt = async (payment: InvoicePaymentRow) => {
    if (!payment?.id || !student?.id) return;
    setDownloadingId(payment.id);
    try {
      const { data: earlier } = await supabase
        .from('invoices')
        .select('id')
        .eq('student_id', student.id)
        .lt('period_start', invoice.period_start || '')
        .limit(1);
      const isFirstInvoice = !earlier || earlier.length === 0;

      await downloadPaymentReceiptPDF({
        payment,
        invoice,
        student,
        allPayments: payments,
        isFirstInvoice,
      });
      toast({ title: 'Receipt downloaded', description: 'Payment receipt PDF saved.' });
    } catch (err) {
      console.error('Download receipt:', err);
      toast({
        title: 'Receipt download failed',
        description: err instanceof Error ? err.message : 'Could not generate receipt PDF.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const amountDue = getEffectiveAmountDue(invoice);
  const amountPaid = getInvoiceAmountPaid(invoice);
  const balance = getInvoiceBalanceRemaining(invoice);

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {!compact && (
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border bg-white p-2">
            <div className="text-muted-foreground text-xs">Amount due</div>
            <div className="font-semibold">KES {amountDue.toLocaleString()}</div>
          </div>
          <div className="rounded-md border bg-white p-2">
            <div className="text-muted-foreground text-xs">Paid</div>
            <div className="font-semibold text-green-700">KES {amountPaid.toLocaleString()}</div>
          </div>
          <div className="rounded-md border bg-white p-2">
            <div className="text-muted-foreground text-xs">Balance</div>
            <div className={`font-semibold ${balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
              KES {balance.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className={`font-semibold ${compact ? 'text-sm' : ''}`}>Payments on this invoice</h4>
          {invoice.payment_status === 'partial' && (
            <Badge className="bg-amber-100 text-amber-800">Partial</Badge>
          )}
          {invoice.payment_status === 'paid' && (
            <Badge className="bg-green-100 text-green-800">Paid in full</Badge>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading payments…</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Method</th>
                  <th className="px-3 py-2 font-medium">Reference / notes</th>
                  <th className="px-3 py-2 font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 whitespace-nowrap">{p.paid_date || '—'}</td>
                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                      KES {(Number(p.amount) || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 capitalize">{p.payment_method || 'cash'}</td>
                    <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">
                      {[p.mpesa_transaction_id, p.notes].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={downloadingId === p.id}
                        onClick={() => void handleDownloadReceipt(p)}
                      >
                        {downloadingId === p.id ? 'Generating…' : 'Download receipt'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
