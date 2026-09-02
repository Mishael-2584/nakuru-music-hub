import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Phase = 'loading' | 'form' | 'waiting' | 'success' | 'failed' | 'error';

const formatKes = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n);

export default function PayInvoicePublic() {
  const [params] = useSearchParams();
  const invoiceId = params.get('invoice') || '';
  const amount = Math.round(Number(params.get('amount') || 0));
  const exp = Number(params.get('exp') || 0);
  const sig = params.get('sig') || '';

  const linkValidShape = useMemo(
    () => Boolean(invoiceId && amount > 0 && exp > 0 && sig),
    [invoiceId, amount, exp, sig],
  );

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [info, setInfo] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const invokePublic = async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error: fnError } = await supabase.functions.invoke('public-invoice-mpesa', {
      body: {
        action,
        invoice_id: invoiceId,
        amount,
        exp,
        sig,
        ...extra,
      },
    });
    if (fnError) {
      throw new Error((data as any)?.error || fnError.message || 'Request failed');
    }
    if ((data as any)?.error) {
      throw new Error((data as any).error);
    }
    return data as any;
  };

  useEffect(() => {
    if (!linkValidShape) {
      setPhase('error');
      setError('This payment link is incomplete or invalid. Ask the academy to resend the invoice.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await invokePublic('info');
        if (cancelled) return;
        setInfo(data);
        setPhone(data.phone_hint || '');
        if (data.already_paid) {
          setPhase('success');
          setStatusMessage('This invoice is already fully paid. Thank you!');
        } else {
          setPhase('form');
        }
      } catch (e) {
        if (cancelled) return;
        setPhase('error');
        setError(e instanceof Error ? e.message : 'Could not load invoice payment page');
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkValidShape, invoiceId, amount, exp, sig]);

  useEffect(() => {
    if (phase !== 'waiting' || !attemptId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const result = await invokePublic('reconcile', { attempt_id: attemptId });
        if (cancelled) return;
        if (result.status === 'completed') {
          setPhase('success');
          setStatusMessage(
            result.mpesa_transaction_id
              ? `Payment received. M-Pesa receipt: ${result.mpesa_transaction_id}`
              : 'Payment received successfully. Thank you!',
          );
          return;
        }
        if (['failed', 'cancelled', 'expired'].includes(result.status)) {
          setPhase('failed');
          setError(result.failure_reason || `Payment ${result.status}`);
          return;
        }
        setStatusMessage('Waiting for M-Pesa confirmation… keep your phone nearby.');
      } catch (e) {
        console.warn('public pay reconcile:', e);
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, attemptId]);

  const handlePay = async () => {
    if (!phone.trim()) {
      setError('Enter the M-Pesa number to pay from.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await invokePublic('initiate', { phone: phone.trim() });
      setAttemptId(result.attempt_id);
      setPhase('waiting');
      setStatusMessage(result.message || 'Check your phone for the M-Pesa prompt.');
    } catch (e) {
      setPhase('failed');
      setError(e instanceof Error ? e.message : 'Could not start M-Pesa payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 to-stone-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Smartphone className="h-5 w-5 text-green-700" />
            Pay with M-Pesa
          </CardTitle>
          <CardDescription>Damon Music Academy invoice payment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {phase === 'loading' && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading invoice…
            </div>
          )}

          {phase === 'error' && (
            <p className="text-sm text-destructive py-4">{error}</p>
          )}

          {(phase === 'form' || phase === 'failed') && info && (
            <>
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between gap-2">
                  <span>Student</span>
                  <span className="font-medium text-right">{info.student_name}</span>
                </div>
                {info.period_label && (
                  <div className="flex justify-between gap-2">
                    <span>Period</span>
                    <span className="font-medium text-right">{info.period_label}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2 border-t pt-1">
                  <span>Amount to pay</span>
                  <span className="font-semibold">{formatKes(info.payable_amount ?? amount)}</span>
                </div>
                {info.balance > (info.payable_amount ?? amount) && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Invoice balance remaining: {formatKes(info.balance)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pay-phone">M-Pesa phone number</Label>
                <Input
                  id="pay-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  inputMode="tel"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="w-full bg-green-700 hover:bg-green-800"
                onClick={() => void handlePay()}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending prompt…
                  </>
                ) : (
                  'Send M-Pesa prompt'
                )}
              </Button>
            </>
          )}

          {phase === 'waiting' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-700" />
              <p className="text-sm font-medium">Waiting for M-Pesa…</p>
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void (async () => {
                    try {
                      const result = await invokePublic('reconcile', { attempt_id: attemptId });
                      if (result.status === 'completed') {
                        setPhase('success');
                        setStatusMessage(
                          result.mpesa_transaction_id
                            ? `Payment received. M-Pesa receipt: ${result.mpesa_transaction_id}`
                            : 'Payment received successfully. Thank you!',
                        );
                      } else if (['failed', 'cancelled', 'expired'].includes(result.status)) {
                        setPhase('failed');
                        setError(result.failure_reason || result.status);
                      } else {
                        setStatusMessage('Still pending — approve the prompt on your phone, then check again.');
                      }
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Could not check status');
                    }
                  })();
                }}
              >
                Check payment status
              </Button>
            </div>
          )}

          {phase === 'success' && (
            <div className="py-6 text-center space-y-2">
              <p className="text-lg font-semibold text-green-700">Payment successful</p>
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
