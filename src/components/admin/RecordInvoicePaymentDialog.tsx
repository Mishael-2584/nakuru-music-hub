import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  formatInvoiceBillingMonth,
  getEffectiveAmountDue,
  getInvoiceAmountPaid,
  getInvoiceBalanceRemaining,
  isInvoiceFullyPaid,
  recordInvoicePayment,
  toLocalDateString,
  analyzeFirstPaymentAlignment,
  executeFirstPaymentAlignment,
  type RecordInvoicePaymentResult,
} from '@/lib/invoiceUtils';
import { supabase } from '@/integrations/supabase/client';

export interface RecordInvoicePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    student_id: string;
    amount_due?: number | null;
    manual_amount_due?: number | null;
    manual_amount_override?: number | null;
    amount_paid?: number | null;
    payment_status?: string | null;
    status?: string | null;
    period_start?: string;
    period_end?: string;
  } | null;
  studentName?: string;
  studentId?: string;
  registrationId?: string | null;
  recordedBy?: string;
  onSuccess: (result: RecordInvoicePaymentResult) => void | Promise<void>;
}

const formatKes = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n);

const RecordInvoicePaymentDialog: React.FC<RecordInvoicePaymentDialogProps> = ({
  open,
  onOpenChange,
  invoice,
  studentName,
  studentId,
  registrationId,
  recordedBy,
  onSuccess,
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mpesaRef, setMpesaRef] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [paidDate, setPaidDate] = useState(toLocalDateString(new Date()));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const balance = invoice ? getInvoiceBalanceRemaining(invoice) : 0;
  const effectiveDue = invoice ? getEffectiveAmountDue(invoice) : 0;
  const amountPaid = invoice ? getInvoiceAmountPaid(invoice) : 0;
  const fullyPaid = invoice ? isInvoiceFullyPaid(invoice) : false;

  useEffect(() => {
    if (!open || !invoice) return;
    setPaymentAmount(balance > 0 ? String(balance) : '');
    setPaymentMethod('cash');
    setMpesaRef('');
    setPayerPhone('');
    setPaidDate(toLocalDateString(new Date()));
    setNotes('');
    setError('');
  }, [open, invoice?.id, invoice?.amount_paid, balance]);

  const parsedAmount = Math.max(0, Number(paymentAmount) || 0);

  const handlePayRemaining = () => {
    if (balance > 0) setPaymentAmount(String(balance));
  };

  const handleSubmit = async () => {
    if (!invoice) return;
    if (fullyPaid || balance <= 0) {
      setError('This invoice is already fully paid.');
      return;
    }
    if (parsedAmount <= 0) {
      setError('Enter a payment amount greater than zero.');
      return;
    }
    if (parsedAmount > balance) {
      setError(`Payment cannot exceed the remaining balance of ${formatKes(balance)}.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      let targetInvoice = invoice;
      let targetInvoiceId = invoice.id;

      if (studentId) {
        const plan = await analyzeFirstPaymentAlignment({
          studentId,
          invoice,
          paidDate,
          registrationId,
        });
        if (plan.needed) {
          const confirmed = window.confirm(
            `${plan.summary}\n\nEarlier unused invoices will be voided. Continue?`
          );
          if (!confirmed) {
            setLoading(false);
            return;
          }
          const aligned = await executeFirstPaymentAlignment(plan);
          targetInvoiceId = aligned.paymentInvoiceId;
          if (aligned.invoice) {
            targetInvoice = aligned.invoice;
          } else {
            const { data: refreshed, error: refreshError } = await supabase
              .from('invoices')
              .select('*')
              .eq('id', targetInvoiceId)
              .single();
            if (refreshError || !refreshed) {
              throw refreshError || new Error('Could not load aligned invoice.');
            }
            targetInvoice = refreshed;
          }
        }
      }

      const targetBalance = getInvoiceBalanceRemaining(targetInvoice);
      if (parsedAmount > targetBalance) {
        setError(`Payment cannot exceed the remaining balance of ${formatKes(targetBalance)}.`);
        setLoading(false);
        return;
      }

      const result = await recordInvoicePayment({
        invoiceId: targetInvoiceId,
        cashAmount: parsedAmount,
        creditAmount: 0,
        paymentMethod,
        mpesaTransactionId: mpesaRef || undefined,
        payerPhone: payerPhone || undefined,
        paidDate,
        notes: notes || undefined,
        recordedBy,
      });
      await onSuccess(result);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {studentName ? `${studentName} — ` : ''}
            {formatInvoiceBillingMonth(invoice) || 'Invoice payment'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md bg-muted p-3 space-y-1">
            <div className="flex justify-between">
              <span>Amount due</span>
              <span className="font-medium">{formatKes(effectiveDue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Already paid</span>
              <span className="font-medium text-green-700">{formatKes(amountPaid)}</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span>Balance remaining</span>
              <span className="font-semibold">{formatKes(balance)}</span>
            </div>
            {fullyPaid && (
              <p className="text-xs text-muted-foreground pt-1 border-t">
                This invoice is fully paid. No further payments can be recorded against it.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="payment-amount">Payment amount (KES)</Label>
            <Input
              id="payment-amount"
              type="number"
              min={0}
              max={balance}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0"
              disabled={fullyPaid || balance <= 0}
            />
          </div>

          {balance > 0 && !fullyPaid && (
            <Button type="button" variant="outline" size="sm" onClick={handlePayRemaining}>
              Fill remaining balance ({formatKes(balance)})
            </Button>
          )}

          <div>
            <Label>Payment method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'mpesa' && (
            <>
              <div>
                <Label htmlFor="mpesa-ref">M-Pesa transaction ID</Label>
                <Input
                  id="mpesa-ref"
                  value={mpesaRef}
                  onChange={(e) => setMpesaRef(e.target.value)}
                  placeholder="e.g. QHK7X..."
                />
              </div>
              <div>
                <Label htmlFor="payer-phone">Payer phone</Label>
                <Input
                  id="payer-phone"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="07..."
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="paid-date">Payment date</Label>
            <Input
              id="paid-date"
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="payment-notes">Notes (optional)</Label>
            <Textarea
              id="payment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Partial payment — balance due end of month"
            />
          </div>

          {parsedAmount > 0 && parsedAmount <= balance && (
            <p className="text-muted-foreground">
              Recording {formatKes(parsedAmount)}
              {parsedAmount < balance
                ? ` · Balance after payment: ${formatKes(balance - parsedAmount)}`
                : ' · This will fully pay the invoice'}
            </p>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={loading || fullyPaid || balance <= 0}
          >
            {loading ? 'Recording...' : 'Record payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecordInvoicePaymentDialog;
