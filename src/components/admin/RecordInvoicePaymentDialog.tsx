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
import { fetchPaymentAttempt, initiateMpesaPayment, reconcileMpesaPayment } from '@/lib/paynexusClient';
import { Loader2 } from 'lucide-react';

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
  studentPhone?: string | null;
  registrationId?: string | null;
  recordedBy?: string;
  onSuccess: (result: RecordInvoicePaymentResult) => void | Promise<void>;
  /** Called when an admin-triggered STK Push completes (webhook already emails receipt). */
  onStkSuccess?: (info: {
    invoiceId: string;
    paymentId?: string | null;
    amount: number;
    mpesaReceipt?: string | null;
  }) => void | Promise<void>;
}

const formatKes = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n);

type MpesaMode = 'stk' | 'manual';
type StkPhase = 'idle' | 'waiting' | 'success' | 'failed';

const RecordInvoicePaymentDialog: React.FC<RecordInvoicePaymentDialogProps> = ({
  open,
  onOpenChange,
  invoice,
  studentName,
  studentId,
  studentPhone,
  registrationId,
  recordedBy,
  onSuccess,
  onStkSuccess,
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mpesaMode, setMpesaMode] = useState<MpesaMode>('stk');
  const [mpesaRef, setMpesaRef] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [paidDate, setPaidDate] = useState(toLocalDateString(new Date()));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stkPhase, setStkPhase] = useState<StkPhase>('idle');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [stkMessage, setStkMessage] = useState('');
  const [stkFailure, setStkFailure] = useState('');

  const balance = invoice ? getInvoiceBalanceRemaining(invoice) : 0;
  const effectiveDue = invoice ? getEffectiveAmountDue(invoice) : 0;
  const amountPaid = invoice ? getInvoiceAmountPaid(invoice) : 0;
  const fullyPaid = invoice ? isInvoiceFullyPaid(invoice) : false;
  const isMpesaStk = paymentMethod === 'mpesa' && mpesaMode === 'stk';

  useEffect(() => {
    if (!open || !invoice) return;
    setPaymentAmount(balance > 0 ? String(Math.round(balance)) : '');
    setPaymentMethod('cash');
    setMpesaMode('stk');
    setMpesaRef('');
    setPayerPhone(studentPhone || '');
    setPaidDate(toLocalDateString(new Date()));
    setNotes('');
    setError('');
    setStkPhase('idle');
    setAttemptId(null);
    setStkMessage('');
    setStkFailure('');
  }, [open, invoice?.id, invoice?.amount_paid, balance, studentPhone]);

  useEffect(() => {
    if (!open || !attemptId || stkPhase !== 'waiting') return;

    let cancelled = false;
    const poll = async () => {
      try {
        const reconciled = await reconcileMpesaPayment({ attemptId });
        if (cancelled) return;

        if (reconciled.success && reconciled.status === 'completed') {
          setStkPhase('success');
          setStkMessage(
            reconciled.mpesa_transaction_id
              ? `Payment received. M-Pesa receipt: ${reconciled.mpesa_transaction_id}`
              : 'Payment received and applied to this invoice.',
          );
          await onStkSuccess?.({
            invoiceId: invoice?.id || '',
            paymentId: reconciled.payment_id,
            amount: parsedAmount,
            mpesaReceipt: reconciled.mpesa_transaction_id,
          });
          return;
        }

        if (
          reconciled.success &&
          reconciled.status &&
          ['failed', 'cancelled', 'expired'].includes(reconciled.status)
        ) {
          setStkPhase('failed');
          setStkFailure(reconciled.failure_reason || `Payment ${reconciled.status}`);
          return;
        }

        const attempt = await fetchPaymentAttempt(attemptId);
        if (cancelled || !attempt) return;

        if (attempt.status === 'completed') {
          setStkPhase('success');
          setStkMessage(
            attempt.mpesa_transaction_id
              ? `Payment received. M-Pesa receipt: ${attempt.mpesa_transaction_id}`
              : 'Payment received and applied to this invoice.',
          );
          await onStkSuccess?.({
            invoiceId: attempt.invoice_id,
            paymentId: attempt.payment_id,
            amount: Number(attempt.amount) || parsedAmount,
            mpesaReceipt: attempt.mpesa_transaction_id,
          });
          return;
        }

        if (['failed', 'cancelled', 'expired'].includes(attempt.status)) {
          setStkPhase('failed');
          setStkFailure(attempt.failure_reason || `Payment ${attempt.status}`);
          return;
        }

        setStkMessage('Waiting for the customer to enter their M-Pesa PIN…');
      } catch (err) {
        console.warn('Admin STK poll:', err);
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 4000);
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setStkMessage(
          'Still waiting. Use “Check status” if they already paid, or close and refresh finances.',
        );
      }
    }, 90_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attemptId, stkPhase, onStkSuccess, invoice?.id]);

  const parsedAmount = Math.max(0, Number(paymentAmount) || 0);

  const handlePayRemaining = () => {
    if (balance > 0) setPaymentAmount(String(Math.round(balance)));
  };

  const handleSendStk = async () => {
    if (!invoice) return;
    if (fullyPaid || balance <= 0) {
      setError('This invoice is already fully paid.');
      return;
    }
    const amount = Math.round(parsedAmount);
    if (amount < 1) {
      setError('Enter a payment amount of at least 1 KES.');
      return;
    }
    if (amount > balance) {
      setError(`Amount cannot exceed the remaining balance of ${formatKes(balance)}.`);
      return;
    }
    if (!payerPhone.trim()) {
      setError('Enter the M-Pesa phone number to prompt.');
      return;
    }

    setLoading(true);
    setError('');
    setStkFailure('');
    try {
      const result = await initiateMpesaPayment({
        invoiceId: invoice.id,
        phone: payerPhone.trim(),
        amount,
        studentId: studentId || invoice.student_id,
      });
      if (!result.success || !result.attempt_id) {
        throw new Error(result.error || 'Could not send M-Pesa prompt');
      }
      setAttemptId(result.attempt_id);
      setStkPhase('waiting');
      setStkMessage(
        result.message ||
          `STK Push sent to ${result.phone || payerPhone}. Ask them to enter their M-Pesa PIN.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send M-Pesa prompt');
      setStkPhase('failed');
      setStkFailure(e instanceof Error ? e.message : 'Failed to send M-Pesa prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!invoice) return;
    if (isMpesaStk) {
      await handleSendStk();
      return;
    }

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
    if (paymentMethod === 'mpesa' && mpesaMode === 'manual' && !mpesaRef.trim()) {
      setError('Enter the M-Pesa transaction ID, or switch to “Send STK Push”.');
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

  const showForm = stkPhase === 'idle' || stkPhase === 'failed';

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

        {stkPhase === 'waiting' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-700" />
            <p className="text-sm font-medium">Waiting for M-Pesa confirmation…</p>
            <p className="text-sm text-muted-foreground max-w-sm">{stkMessage}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void (async () => {
                  const reconciled = await reconcileMpesaPayment({ attemptId: attemptId! });
                  if (reconciled.success && reconciled.status === 'completed') {
                    setStkPhase('success');
                    setStkMessage(
                      reconciled.mpesa_transaction_id
                        ? `Payment received. M-Pesa receipt: ${reconciled.mpesa_transaction_id}`
                        : 'Payment received and applied to this invoice.',
                    );
                    await onStkSuccess?.({
                      invoiceId: invoice.id,
                      paymentId: reconciled.payment_id,
                      amount: parsedAmount,
                      mpesaReceipt: reconciled.mpesa_transaction_id,
                    });
                  } else if (
                    reconciled.status &&
                    ['failed', 'cancelled', 'expired'].includes(reconciled.status)
                  ) {
                    setStkPhase('failed');
                    setStkFailure(reconciled.failure_reason || reconciled.status);
                  } else {
                    setStkMessage('Still pending on M-Pesa — ask them to approve the prompt, then check again.');
                  }
                })();
              }}
            >
              Check status
            </Button>
          </div>
        )}

        {stkPhase === 'success' && (
          <div className="py-4 text-center space-y-2">
            <p className="text-lg font-semibold text-green-700">Payment successful</p>
            <p className="text-sm text-muted-foreground">{stkMessage}</p>
          </div>
        )}

        {showForm && (
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
              <Select
                value={paymentMethod}
                onValueChange={(v) => {
                  setPaymentMethod(v);
                  setError('');
                  if (v === 'mpesa') setMpesaMode('stk');
                }}
              >
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
              <div className="space-y-3 rounded-md border p-3">
                <div>
                  <Label>M-Pesa action</Label>
                  <Select
                    value={mpesaMode}
                    onValueChange={(v) => setMpesaMode(v as MpesaMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stk">Send STK Push (prompt phone)</SelectItem>
                      <SelectItem value="manual">Record past M-Pesa payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payer-phone">
                    {mpesaMode === 'stk' ? 'Phone to prompt' : 'Payer phone'}
                  </Label>
                  <Input
                    id="payer-phone"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    inputMode="tel"
                  />
                  {mpesaMode === 'stk' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Customer will get an M-Pesa PIN prompt for this invoice amount.
                    </p>
                  )}
                </div>

                {mpesaMode === 'manual' && (
                  <div>
                    <Label htmlFor="mpesa-ref">M-Pesa transaction ID</Label>
                    <Input
                      id="mpesa-ref"
                      value={mpesaRef}
                      onChange={(e) => setMpesaRef(e.target.value)}
                      placeholder="e.g. UGNRK0B1IO"
                    />
                  </div>
                )}
              </div>
            )}

            {!isMpesaStk && (
              <>
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
              </>
            )}

            {parsedAmount > 0 && parsedAmount <= balance && (
              <p className="text-muted-foreground">
                {isMpesaStk ? 'Will prompt for' : 'Recording'} {formatKes(parsedAmount)}
                {parsedAmount < balance
                  ? ` · Balance after payment: ${formatKes(balance - parsedAmount)}`
                  : ' · This will fully pay the invoice'}
              </p>
            )}

            {stkPhase === 'failed' && stkFailure && (
              <p className="text-destructive text-sm">{stkFailure}</p>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {stkPhase === 'waiting' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close (keep waiting in background)
            </Button>
          )}
          {stkPhase === 'success' && (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
          {showForm && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={loading || fullyPaid || balance <= 0}
                className={isMpesaStk ? 'bg-green-700 hover:bg-green-800' : undefined}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isMpesaStk ? 'Sending…' : 'Recording...'}
                  </>
                ) : isMpesaStk ? (
                  'Send M-Pesa prompt'
                ) : (
                  'Record payment'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecordInvoicePaymentDialog;
