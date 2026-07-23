import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { getInvoiceBalanceRemaining } from '../../lib/invoiceUtils';
import { fetchPaymentAttempt, initiateMpesaPayment } from '../../lib/paynexusClient';
import { Loader2, Smartphone } from 'lucide-react';

interface PayInvoiceMpesaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    amount_due?: number;
    amount_paid?: number;
    payment_status?: string;
    manual_amount_due?: number | null;
    manual_amount_override?: number | null;
    period_start?: string | null;
    period_end?: string | null;
  } | null;
  defaultPhone?: string;
  onPaymentComplete?: () => void;
}

type Phase = 'form' | 'waiting' | 'success' | 'failed';

export default function PayInvoiceMpesaDialog({
  open,
  onOpenChange,
  invoice,
  defaultPhone = '',
  onPaymentComplete,
}: PayInvoiceMpesaDialogProps) {
  const { toast } = useToast();
  const balance = invoice ? Math.round(getInvoiceBalanceRemaining(invoice)) : 0;
  const [phone, setPhone] = useState(defaultPhone);
  const [amount, setAmount] = useState(String(balance || ''));
  const [phase, setPhase] = useState<Phase>('form');
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [failureReason, setFailureReason] = useState('');

  useEffect(() => {
    if (open && invoice) {
      setPhone(defaultPhone || '');
      setAmount(String(Math.round(getInvoiceBalanceRemaining(invoice)) || ''));
      setPhase('form');
      setAttemptId(null);
      setStatusMessage('');
      setFailureReason('');
      setSubmitting(false);
    }
  }, [open, invoice?.id, defaultPhone]);

  useEffect(() => {
    if (!open || !attemptId || phase !== 'waiting') return;

    let cancelled = false;
    const poll = async () => {
      try {
        const attempt = await fetchPaymentAttempt(attemptId);
        if (cancelled || !attempt) return;

        if (attempt.status === 'completed') {
          setPhase('success');
          setStatusMessage(
            attempt.mpesa_transaction_id
              ? `Payment received. M-Pesa receipt: ${attempt.mpesa_transaction_id}`
              : 'Payment received successfully.',
          );
          toast({
            title: 'Payment successful',
            description: 'Your invoice has been updated.',
          });
          onPaymentComplete?.();
          return;
        }

        if (['failed', 'cancelled', 'expired'].includes(attempt.status)) {
          setPhase('failed');
          setFailureReason(attempt.failure_reason || `Payment ${attempt.status}`);
          return;
        }

        setStatusMessage('Waiting for M-Pesa confirmation… keep your phone nearby.');
      } catch (err) {
        console.warn('Poll payment attempt:', err);
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 3000);
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setStatusMessage(
          'Still waiting for confirmation. If you paid, this page will update shortly — or refresh in a minute.',
        );
      }
    }, 90000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
  }, [open, attemptId, phase, onPaymentComplete, toast]);

  const handleSubmit = async () => {
    if (!invoice) return;
    const amt = Math.round(Number(amount));
    if (!phone.trim()) {
      toast({ title: 'Phone required', description: 'Enter the M-Pesa number to pay from.', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(amt) || amt < 1) {
      toast({ title: 'Invalid amount', description: 'Enter at least 1 KES.', variant: 'destructive' });
      return;
    }
    if (amt > balance) {
      toast({
        title: 'Amount too high',
        description: `Remaining balance is KES ${balance.toLocaleString()}.`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await initiateMpesaPayment({
        invoiceId: invoice.id,
        phone: phone.trim(),
        amount: amt,
      });

      if (!result.success || !result.attempt_id) {
        throw new Error(result.error || 'Could not start M-Pesa payment');
      }

      setAttemptId(result.attempt_id);
      setPhase('waiting');
      setStatusMessage(result.message || 'Check your phone for the M-Pesa prompt.');
      toast({
        title: 'STK Push sent',
        description: 'Enter your M-Pesa PIN on your phone to complete payment.',
      });
    } catch (err) {
      toast({
        title: 'Could not start payment',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Pay with M-Pesa
          </DialogTitle>
        </DialogHeader>

        {phase === 'form' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Remaining balance: <strong>KES {balance.toLocaleString()}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="mpesa-phone">M-Pesa phone number</Label>
              <Input
                id="mpesa-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mpesa-amount">Amount (KES)</Label>
              <Input
                id="mpesa-amount"
                type="number"
                min={1}
                max={balance}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can pay in full or enter a partial amount.
              </p>
            </div>
          </div>
        )}

        {phase === 'waiting' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-700" />
            <p className="text-sm font-medium">Waiting for M-Pesa…</p>
            <p className="text-sm text-muted-foreground max-w-sm">{statusMessage}</p>
          </div>
        )}

        {phase === 'success' && (
          <div className="py-4 text-center space-y-2">
            <p className="text-lg font-semibold text-green-700">Payment successful</p>
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          </div>
        )}

        {phase === 'failed' && (
          <div className="py-4 text-center space-y-2">
            <p className="text-lg font-semibold text-red-700">Payment not completed</p>
            <p className="text-sm text-muted-foreground">{failureReason}</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {phase === 'form' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={submitting || balance < 1}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send STK Push'
                )}
              </Button>
            </>
          )}
          {phase === 'waiting' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
          {(phase === 'success' || phase === 'failed') && (
            <>
              {phase === 'failed' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setPhase('form');
                    setAttemptId(null);
                    setFailureReason('');
                  }}
                >
                  Try again
                </Button>
              )}
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
