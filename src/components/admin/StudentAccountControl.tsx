import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, AlertCircle, CheckCircle, Ban, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  student_name: string;
  email: string;
  account_suspended: boolean;
  suspension_reason?: string | null;
  suspended_at?: string | null;
  first_invoice_paid: boolean;
  first_invoice_paid_date?: string | null;
  can_book_classes: boolean;
  account_notes?: string | null;
}

interface StudentAccountControlProps {
  student: Student;
  onUpdate: () => void;
}

export default function StudentAccountControl({ student, onUpdate }: StudentAccountControlProps) {
  const { toast } = useToast();
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [accountNotes, setAccountNotes] = useState(student.account_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuspendAccount = async () => {
    if (!suspensionReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for suspending this account',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase.rpc('suspend_student_account', {
        p_student_id: student.id,
        p_reason: suspensionReason.trim(),
        p_suspended_by: user.id
      });

      if (error) throw error;

      toast({
        title: 'Account Suspended',
        description: `${student.student_name}'s account has been suspended. They will no longer be able to access classes or book sessions.`,
        variant: 'destructive'
      });

      setIsSuspendDialogOpen(false);
      setSuspensionReason('');
      onUpdate();
    } catch (error) {
      console.error('Error suspending account:', error);
      toast({
        title: 'Error',
        description: 'Failed to suspend account',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateAccount = async () => {
    if (!confirm(`Are you sure you want to reactivate ${student.student_name}'s account?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('activate_student_account', {
        p_student_id: student.id
      });

      if (error) throw error;

      toast({
        title: 'Account Activated',
        description: `${student.student_name}'s account has been reactivated.${student.first_invoice_paid ? ' They can now book classes.' : ' Note: First invoice must be paid before they can book classes.'}`
      });

      onUpdate();
    } catch (error) {
      console.error('Error activating account:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate account',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          account_notes: accountNotes.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Account notes updated successfully'
      });

      setIsNotesDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to update account notes',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className={`border-2 ${student.account_suspended ? 'border-red-300 bg-red-50' : student.first_invoice_paid ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Account Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {student.account_suspended ? (
                  <Ban className="h-5 w-5 text-red-600" />
                ) : student.can_book_classes ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                <div>
                  <p className="font-semibold text-sm">Account Status</p>
                  {student.account_suspended ? (
                    <Badge variant="destructive" className="mt-1">
                      <Ban className="h-3 w-3 mr-1" />
                      Suspended
                    </Badge>
                  ) : student.can_book_classes ? (
                    <Badge className="mt-1 bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active - Can Book
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-1 bg-yellow-50 text-yellow-700 border-yellow-300">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Awaiting First Payment
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {student.account_suspended ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleActivateAccount}
                  disabled={isSubmitting}
                  className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Activate
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSuspendDialogOpen(true)}
                  disabled={isSubmitting}
                  className="bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Suspend
                </Button>
              )}
            </div>

            {/* First Invoice Status */}
            <div className="flex items-center justify-between text-sm border-t pt-2">
              <span className="text-gray-600">First Invoice:</span>
              {student.first_invoice_paid ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Paid</span>
                  {student.first_invoice_paid_date && (
                    <span className="text-xs text-gray-500">
                      ({new Date(student.first_invoice_paid_date).toLocaleDateString()})
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Unpaid</span>
                </div>
              )}
            </div>

            {/* Suspension Reason (if suspended) */}
            {student.account_suspended && student.suspension_reason && (
              <div className="bg-red-100 border border-red-200 rounded p-2 text-sm">
                <p className="font-semibold text-red-800 mb-1">Suspension Reason:</p>
                <p className="text-red-700">{student.suspension_reason}</p>
                {student.suspended_at && (
                  <p className="text-xs text-red-600 mt-1">
                    Suspended: {new Date(student.suspended_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Account Notes */}
            <div className="border-t pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">Admin Notes:</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsNotesDialogOpen(true)}
                  className="h-6 text-xs"
                >
                  Edit Notes
                </Button>
              </div>
              {student.account_notes ? (
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{student.account_notes}</p>
              ) : (
                <p className="text-xs text-gray-400 italic">No notes</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suspend Dialog */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              Suspend Account: {student.student_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              <p className="font-semibold mb-1">⚠️ Warning:</p>
              <p>Suspending this account will:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Block all access to the student portal</li>
                <li>Prevent the student from booking classes</li>
                <li>Hide the student from active student lists</li>
                <li>Require manual reactivation by an admin</li>
              </ul>
            </div>

            <div>
              <Label htmlFor="suspension-reason" className="text-sm font-semibold">
                Reason for Suspension *
              </Label>
              <Textarea
                id="suspension-reason"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="E.g., 'Non-payment of fees', 'Violation of terms', 'Requested by student', etc."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSuspendDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspendAccount}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Suspending...' : 'Suspend Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Notes: {student.student_name}</DialogTitle>
          </DialogHeader>

          <div>
            <Label htmlFor="account-notes" className="text-sm font-semibold">
              Admin Notes
            </Label>
            <Textarea
              id="account-notes"
              value={accountNotes}
              onChange={(e) => setAccountNotes(e.target.value)}
              placeholder="Add any notes about this student's account, payment arrangements, special circumstances, etc."
              rows={5}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes are only visible to admins and are not shown to the student.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNotesDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

