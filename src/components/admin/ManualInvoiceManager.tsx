import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, AlertTriangle, DollarSign, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/priceFormatter';
import {
  getEffectiveAmountDue,
  getInvoiceAmountPaid,
  invoiceHasRecordedPayments,
  isInvoiceFullyPaid,
  formatInvoiceBillingMonth,
} from '@/lib/invoiceUtils';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  student_id: string;
  amount_due: number;
  manual_amount_due?: number | null;
  manual_amount_override?: number | null;
  manual_balance?: number | null;
  override_reason?: string | null;
  status: string;
  period_start: string;
  period_end: string;
  due_date: string;
  overridden_by?: string | null;
  overridden_at?: string | null;
  pdf_url?: string | null;
  lessons_summary?: {
    lineItems?: InvoiceLineItem[];
    subtotal?: number;
    total?: number;
  };
  invoice_details?: {
    lineItems?: InvoiceLineItem[];
    subtotal?: number;
    total?: number;
  };
  students?: {
    student_name: string;
    email: string;
  };
}

interface ManualInvoiceManagerProps {
  invoice: Invoice;
  onUpdate: () => void;
}

export default function ManualInvoiceManager({ invoice, onUpdate }: ManualInvoiceManagerProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getExistingLineItems = (): InvoiceLineItem[] => {
    const items = invoice.lessons_summary?.lineItems || invoice.invoice_details?.lineItems;
    if (items && items.length > 0) {
      return items.map((item) => ({ ...item }));
    }
    const effective = getEffectiveAmountDue(invoice);
    return [
      {
        description: 'Classes',
        quantity: 1,
        unitPrice: effective,
        amount: effective,
      },
    ];
  };

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(getExistingLineItems());
  const [overrideReason, setOverrideReason] = useState<string>(invoice.override_reason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const newItems = [...lineItems];
    if (field === 'description') {
      newItems[index].description = value as string;
    } else if (field === 'quantity' || field === 'unitPrice') {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      newItems[index][field] = numValue;
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    }
    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        description: 'New Item',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) {
      toast({
        title: 'Cannot Remove',
        description: 'Invoice must have at least one line item',
        variant: 'destructive',
      });
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => lineItems.reduce((sum, item) => sum + item.amount, 0);

  const handleSaveOverride = async () => {
    const hasPayments = invoiceHasRecordedPayments(invoice) || isInvoiceFullyPaid(invoice);
    if (hasPayments) {
      const confirmed = confirm(
        'This invoice has recorded payments. Saving will update the amount and recalculate the balance and payment status. Continue?'
      );
      if (!confirmed) return;
    }

    const calculatedAmount = calculateTotal();

    if (calculatedAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Total amount must be greater than zero',
        variant: 'destructive',
      });
      return;
    }

    if (!overrideReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for the manual override',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      const invoiceDetails = {
        lineItems,
        subtotal: calculatedAmount,
        total: calculatedAmount,
      };

      // Prefer full override metadata; fall back if older DBs lack override columns.
      let updatedRow: Record<string, unknown> | null = null;
      let error: { message?: string } | null = null;

      const fullUpdate = await supabase
        .from('invoices')
        .update({
          amount_due: calculatedAmount,
          manual_amount_due: calculatedAmount,
          manual_amount_override: calculatedAmount,
          lessons_summary: invoiceDetails,
          override_reason: overrideReason.trim(),
          overridden_by: user.id,
          overridden_at: new Date().toISOString(),
          pdf_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id)
        .select('id, amount_due, manual_amount_due, manual_amount_override, lessons_summary')
        .maybeSingle();

      updatedRow = fullUpdate.data;
      error = fullUpdate.error;

      const missingColumn =
        error?.message?.includes('schema cache') ||
        error?.message?.includes('does not exist') ||
        error?.message?.includes('overridden_at') ||
        error?.message?.includes('manual_amount');

      if (error && missingColumn) {
        const fallbackUpdate = await supabase
          .from('invoices')
          .update({
            amount_due: calculatedAmount,
            lessons_summary: invoiceDetails,
            pdf_url: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoice.id)
          .select('id, amount_due, lessons_summary')
          .maybeSingle();

        updatedRow = fallbackUpdate.data;
        error = fallbackUpdate.error;
      }

      if (error) throw error;
      if (!updatedRow) {
        throw new Error(
          'Update did not apply. You may not have permission to edit this invoice, or it was removed.'
        );
      }

      toast({
        title: 'Invoice updated',
        description: `Amount saved as ${formatPrice(calculatedAmount)}. Use Send Invoice when you are ready to email the student — nothing was emailed.`,
      });

      setIsDialogOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update invoice',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearOverride = async () => {
    const hasPayments = invoiceHasRecordedPayments(invoice) || isInvoiceFullyPaid(invoice);
    const confirmMessage = hasPayments
      ? 'This invoice has recorded payments. Clearing the override will recalculate the balance and payment status. Continue?'
      : 'Clear the manual override? The saved line-item total in amount_due will remain.';

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          manual_amount_due: null,
          manual_amount_override: null,
          override_reason: null,
          overridden_by: null,
          overridden_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Manual override cleared',
      });

      onUpdate();
    } catch (error: any) {
      console.error('Error clearing override:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to clear override',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = () => {
    setLineItems(getExistingLineItems());
    setOverrideReason(invoice.override_reason || '');
    setIsDialogOpen(true);
  };

  const effectiveAmount = getEffectiveAmountDue(invoice);
  const hasOverride =
    (invoice.manual_amount_due !== null && invoice.manual_amount_due !== undefined) ||
    (invoice.manual_amount_override !== null && invoice.manual_amount_override !== undefined);
  const hasPayments = invoiceHasRecordedPayments(invoice) || isInvoiceFullyPaid(invoice);

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${hasOverride ? 'text-orange-600' : 'text-gray-900'}`}>
              {formatPrice(effectiveAmount)}
            </span>
            {hasOverride && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                <Edit className="h-3 w-3 mr-1" />
                Manual Override
              </Badge>
            )}
          </div>
          {hasOverride && Number(invoice.amount_due) !== effectiveAmount && (
            <div className="text-xs text-gray-500 mt-1">Base: {formatPrice(invoice.amount_due)}</div>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleOpenDialog}
          className="flex items-center gap-1"
          title={hasPayments ? 'Edit invoice amount (has recorded payments)' : 'Edit invoice amount'}
        >
          <DollarSign className="h-4 w-4" />
          Edit Amount
        </Button>

        {hasOverride && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearOverride}
            className="text-red-600 hover:text-red-700"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              Edit Invoice - Line Items
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 flex-1">
            {hasPayments && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-amber-900">
                <p className="font-semibold mb-1">Paid invoice correction</p>
                <p className="leading-relaxed">
                  This invoice already has payments recorded (KES {getInvoiceAmountPaid(invoice).toLocaleString()}{' '}
                  paid). Saving changes will update the amount due and recalculate the remaining balance and
                  payment status.
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-blue-800">
              <p className="font-semibold mb-1">Save vs Send</p>
              <p className="leading-relaxed">
                Saving updates the invoice in admin only. The student is emailed only when you click{' '}
                <strong>Send Invoice</strong>.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <Label className="text-xs sm:text-sm font-semibold text-blue-900 mb-2 block">
                Student Information
              </Label>
              <div className="space-y-1 text-xs sm:text-sm text-blue-800">
                <p className="break-words">
                  <strong>Name:</strong> {invoice.students?.student_name || 'N/A'}
                </p>
                <p className="break-all">
                  <strong>Email:</strong> {invoice.students?.email || 'N/A'}
                </p>
                <p className="text-xs">
                  <strong>Billing period:</strong> {formatInvoiceBillingMonth(invoice) || 'N/A'}
                </p>
              </div>
            </div>

            <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 sm:p-4">
              <Label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                Current Amount Due
              </Label>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatPrice(effectiveAmount)}</div>
            </div>

            <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50/50 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-blue-900 text-base">Invoice Line Items</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addLineItem}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Line
                </Button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="bg-white border border-gray-300 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeLineItem(index)}
                        className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder="E.g., Piano Lessons - 12 sessions"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Unit Price (KES)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Amount (KES)</Label>
                          <Input
                            type="text"
                            value={formatPrice(item.amount)}
                            readOnly
                            className="bg-gray-100 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-semibold text-lg">TOTAL INVOICE:</span>
                  <span className="font-bold text-green-700 text-2xl">{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="override-reason" className="text-sm font-semibold text-gray-700 block">
                Reason for Override *
              </Label>
              <Textarea
                id="override-reason"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="E.g., 'Changed to 12 sessions', 'Special discount approved'"
                rows={4}
                className="resize-none"
              />
            </div>

            {hasOverride && invoice.overridden_at && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <p>
                  <strong>Last Override:</strong> {new Date(invoice.overridden_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-gray-50 shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto sm:min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSaveOverride()}
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto sm:min-w-[140px]"
            >
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Amount
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
