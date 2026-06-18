import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { sendInvoiceEmail } from '@/lib/emailService';
import {
  getEffectiveAmountDue,
  getInvoiceAmountPaid,
  invoiceHasRecordedPayments,
  isInvoiceFullyPaid,
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
  manual_amount_override?: number | null;
  manual_balance?: number | null;
  override_reason?: string | null;
  status: string;
  period_start: string;
  period_end: string;
  due_date: string;
  overridden_by?: string | null;
  overridden_at?: string | null;
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
  
  // Get existing line items from invoice
  const getExistingLineItems = (): InvoiceLineItem[] => {
    const items = invoice.lessons_summary?.lineItems || invoice.invoice_details?.lineItems;
    if (items && items.length > 0) {
      return items.map(item => ({ ...item }));
    }
    // Default if no items exist
    return [{
      description: 'Classes',
      quantity: 1,
      unitPrice: 0,
      amount: 0
    }];
  };
  
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(getExistingLineItems());
  const [overrideReason, setOverrideReason] = useState<string>(invoice.override_reason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Recalculate line item amount when quantity or unitPrice changes
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
    setLineItems([...lineItems, {
      description: 'New Item',
      quantity: 1,
      unitPrice: 0,
      amount: 0
    }]);
  };
  
  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) {
      toast({
        title: 'Cannot Remove',
        description: 'Invoice must have at least one line item',
        variant: 'destructive'
      });
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };
  
  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  };
  
  const handleSaveOverride = async () => {
    if (invoiceHasRecordedPayments(invoice) || isInvoiceFullyPaid(invoice)) {
      toast({
        title: 'Cannot edit',
        description: 'This invoice has recorded payments. Amount cannot be changed after payment.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const calculatedAmount = calculateTotal();

      if (calculatedAmount < 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Total amount cannot be negative',
          variant: 'destructive'
        });
        return;
      }

      if (!overrideReason.trim()) {
        toast({
          title: 'Reason Required',
          description: 'Please provide a reason for the manual override',
          variant: 'destructive'
        });
        return;
      }

      // Build detailed invoice breakdown for storage
      const invoiceDetails = {
        lineItems: lineItems,
        subtotal: calculatedAmount,
        total: calculatedAmount
      };

    const { error } = await supabase
      .from('invoices')
      .update({
        amount_due: calculatedAmount, // Update the actual amount
        lessons_summary: invoiceDetails, // Update breakdown
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id);

      if (error) throw error;

      // Fetch updated invoice with student data to send email
      const { data: updatedInvoiceData, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          students (
            id,
            student_name,
            email
          )
        `)
        .eq('id', invoice.id)
        .single();

      if (!fetchError && updatedInvoiceData && updatedInvoiceData.students) {
        // Check if this is the first invoice by checking if student has any other invoices
        const { data: otherInvoices } = await supabase
          .from('invoices')
          .select('id')
          .eq('student_id', updatedInvoiceData.student_id)
          .neq('id', invoice.id)
          .limit(1);
        
        const isFirstInvoice = !otherInvoices || otherInvoices.length === 0;
        
        // Check if invoice has been paid (for credentials message logic)
        const effectiveDue =
          updatedInvoiceData.manual_amount_due ??
          updatedInvoiceData.manual_amount_override ??
          updatedInvoiceData.amount_due ??
          0;
        const amountPaid = Number(updatedInvoiceData.amount_paid) || 0;
        const invoicePaid =
          updatedInvoiceData.payment_status === 'paid' ||
          updatedInvoiceData.status === 'paid' ||
          (amountPaid > 0 && amountPaid >= Number(effectiveDue));
        
        // Send updated invoice email to student with isUpdated flag
        // Only show credentials message if it's first invoice AND not paid yet
        await sendInvoiceEmail(
          updatedInvoiceData,
          {
            id: updatedInvoiceData.students.id,
            student_name: updatedInvoiceData.students.student_name,
            email: updatedInvoiceData.students.email
          },
          {
            subject: `Updated Invoice - ${updatedInvoiceData.students.student_name} - Damon Music Academy`,
            isUpdated: true,
            isFirstInvoice: isFirstInvoice && !invoicePaid // Only true if first invoice AND not paid
          }
        );
        
        toast({
          title: 'Success',
          description: `Invoice updated to ${formatPrice(calculatedAmount)} and email sent to student`
        });
      } else {
        toast({
          title: 'Success',
          description: `Invoice updated to ${formatPrice(calculatedAmount)}`
        });
      }

      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearOverride = async () => {
    if (invoiceHasRecordedPayments(invoice) || isInvoiceFullyPaid(invoice)) {
      toast({
        title: 'Cannot restore',
        description: 'This invoice has recorded payments. Amount cannot be changed after payment.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to restore the original invoice amount?')) {
      return;
    }

    // Restore from lessons_summary if available
    const originalTotal = invoice.lessons_summary?.total || 0;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          amount_due: originalTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invoice amount has been restored'
      });

      onUpdate();
    } catch (error) {
      console.error('Error restoring invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore invoice',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = () => {
    if (invoiceHasRecordedPayments(invoice) || isInvoiceFullyPaid(invoice)) {
      toast({
        title: 'Cannot edit',
        description: 'This invoice has recorded payments. Amount cannot be changed after payment.',
        variant: 'destructive',
      });
      return;
    }
    setLineItems(getExistingLineItems());
    setOverrideReason(invoice.override_reason || '');
    setIsDialogOpen(true);
  };

  // Get effective amount - prioritize lessons_summary.total, then amount_due
  const getEffectiveAmount = () => {
    const fromUtils = getEffectiveAmountDue(invoice);
    if (fromUtils > 0) return fromUtils;
    if (invoice.lessons_summary?.total && invoice.lessons_summary.total > 0) {
      return invoice.lessons_summary.total;
    }
    return invoice.amount_due;
  };
  
  const effectiveAmount = getEffectiveAmount();
  const hasOverride = false;
  const amountLocked = invoiceHasRecordedPayments(invoice) || isInvoiceFullyPaid(invoice);

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
          {hasOverride && invoice.amount_due !== effectiveAmount && (
            <div className="text-xs text-gray-500 mt-1">
              Original: {formatPrice(invoice.amount_due)}
            </div>
          )}
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleOpenDialog}
          disabled={amountLocked}
          className="flex items-center gap-1"
          title={amountLocked ? 'Locked after payment recorded' : 'Edit invoice amount'}
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
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-orange-800">
              <p className="font-semibold mb-1">⚠️ Important:</p>
              <p className="leading-relaxed">You're editing the invoice line items. The total will be automatically calculated. Add or remove rows as needed.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <Label className="text-xs sm:text-sm font-semibold text-blue-900 mb-2 block">
                Student Information
              </Label>
              <div className="space-y-1 text-xs sm:text-sm text-blue-800">
                <p className="break-words"><strong>Name:</strong> {invoice.students?.student_name || 'N/A'}</p>
                <p className="break-all"><strong>Email:</strong> {invoice.students?.email || 'N/A'}</p>
                <p className="text-xs"><strong>Period:</strong> {invoice.period_start} to {invoice.period_end}</p>
              </div>
            </div>

            <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 sm:p-4">
              <Label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                Original Invoice Amount
              </Label>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {formatPrice(invoice.amount_due)}
              </div>
            </div>

            <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50/50 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-blue-900 text-base">📋 Invoice Line Items</h3>
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
                          placeholder="E.g., Piano Lessons - 2 sessions/week × 4 weeks"
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

              {/* Total Display */}
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
                placeholder="E.g., 'Partial month adjustment - joined mid-month', 'Special discount approved', 'Added extra sessions'"
                rows={4}
                className="resize-none"
              />
            </div>

            {hasOverride && invoice.overridden_at && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <p><strong>Last Override:</strong> {new Date(invoice.overridden_at).toLocaleString()}</p>
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
              onClick={handleSaveOverride}
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto sm:min-w-[140px]"
            >
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Override
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

