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
import { Checkbox } from '@/components/ui/checkbox';
import {
  fetchStudentCreditBalance,
  getEffectiveAmountDue,
  getInvoiceAmountPaid,
  getInvoiceBalanceRemaining,
  recordInvoicePayment,
  toLocalDateString,
  type RecordInvoicePaymentResult,
} from '@/lib/invoiceUtils';

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
    period_start?: string;
    period_end?: string;
  } | null;
  studentName?: string;
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
  recordedBy,
  onSuccess,
}) => {
  const [cashAmount, setCashAmount] = useState('');
  const [useCredit, setUseCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mpesaRef, setMpesaRef] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [paidDate, setPaidDate] = useState(toLocalDateString(new Date()));
  const [notes, setNotes] = useState('');
  const [creditBalance, setCreditBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const balance = invoice ? getInvoiceBalanceRemaining(invoice) : 0;
  const effectiveDue = invoice ? getEffectiveAmountDue(invoice) : 0;
  const amountPaid = invoice ? getInvoiceAmountPaid(invoice) : 0;

  useEffect(() => {
    if (!open || !invoice) return;
    setCashAmount(balance > 0 ? String(balance) : '');
    setUseCredit(false);
    setCreditAmount('');
    setPaymentMethod('cash');
    setMpesaRef('');
    setPayerPhone('');
    setPaidDate(toLocalDateString(new Date()));
    setNotes('');
    setError('');
    void fetchStudentCreditBalance(invoice.student_id)
      .then(setCreditBalance)
      .catch(() => setCreditBalance(0));
  }, [open, invoice?.id, invoice?.amount_paid, balance]);

  const parsedCash = Math.max(0, Number(cashAmount) || 0);
  const parsedCredit = useCredit ? Math.max(0, Number(creditAmount) || 0) : 0;
  const totalPayment = parsedCash + parsedCredit;

  const handlePayRemaining = () => {
    const creditPart = useCredit ? Math.min(parsedCredit, creditBalance, balance) : 0;
    const cashPart = Math.max(0, balance - creditPart);
    setCashAmount(String(cashPart));
    if (useCredit) setCreditAmount(String(creditPart));
  };

  const handleSubmit = async () => {
    if (!invoice) return;
    if (totalPayment <= 0) {
      setError('Enter a payment amount greater than zero.');
      return;
    }
    if (parsedCredit > creditBalance) {
      setError(`Only ${formatKes(creditBalance)} credit available.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await recordInvoicePayment({
        invoiceId: invoice.id,
        cashAmount: parsedCash,
        creditAmount: parsedCredit,
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
            {invoice.period_start && invoice.period_end
              ? `${invoice.period_start} to ${invoice.period_end}`
              : 'Invoice payment'}
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
            {creditBalance > 0 && (
              <div className="flex justify-between text-blue-700">
                <span>Account credit</span>
                <span className="font-medium">{formatKes(creditBalance)}</span>
              </div>
            )}
            {balance === 0 && (
              <p className="text-xs text-muted-foreground pt-1 border-t">
                This invoice is fully paid. Any amount you record will be added to the student&apos;s account credit.
              </p>
            )}
          </div>

          {creditBalance > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="use-credit"
                checked={useCredit}
                onCheckedChange={(v) => setUseCredit(!!v)}
              />
              <Label htmlFor="use-credit">Apply account credit</Label>
            </div>
          )}

          {useCredit && creditBalance > 0 && (
            <div>
              <Label htmlFor="credit-amount">Credit to apply (KES)</Label>
              <Input
                id="credit-amount"
                type="number"
                min={0}
                max={creditBalance}
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          <div>
            <Label htmlFor="cash-amount">Cash received (KES)</Label>
            <Input
              id="cash-amount"
              type="number"
              min={0}
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          {balance > 0 && (
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

          {totalPayment > 0 && (
            <p className="text-muted-foreground">
              Total: {formatKes(totalPayment)}
              {balance === 0 && (
                <span className="text-blue-700 block">
                  {formatKes(totalPayment)} will be added to account credit
                </span>
              )}
              {totalPayment > balance && balance > 0 && (
                <span className="text-blue-700 block">
                  {formatKes(totalPayment - balance)} will be added to account credit
                </span>
              )}
            </p>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? 'Recording...' : 'Record payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecordInvoicePaymentDialog;
