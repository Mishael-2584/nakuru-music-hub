import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Plus, Eye, Edit } from 'lucide-react';
import { Link } from "react-router-dom";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_type: string;
  payment_method: string;
  status: string;
  due_date: string;
  paid_date?: string;
  receipt_number?: string;
  notes?: string;
  student_id: string;
  student_name?: string;
}

interface PaymentManagerProps {
  payments: Payment[];
  onAddPayment: (payment: any) => void;
  onUpdatePayment: (id: string, payment: any) => void;
  onDeletePayment: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({
  payments,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onMarkAsPaid
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    currency: 'KES',
    payment_type: 'tuition',
    payment_method: 'cash',
    status: 'pending',
    due_date: '',
    notes: '',
    student_id: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [mediaConsent, setMediaConsent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPayment) {
      onUpdatePayment(editingPayment.id, newPayment);
    } else {
      onAddPayment(newPayment);
    }
    setShowModal(false);
    setEditingPayment(null);
    setNewPayment({
      amount: 0,
      currency: 'KES',
      payment_type: 'tuition',
      payment_method: 'cash',
      status: 'pending',
      due_date: '',
      notes: '',
      student_id: ''
    });
  };

  const formatCurrency = (amount: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
                <div className="text-sm text-gray-600">Total Paid</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{formatCurrency(totalOverdue)}</div>
                <div className="text-sm text-gray-600">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{payments.length}</div>
                <div className="text-sm text-gray-600">Total Invoices</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Payment Button */}
      <div className="flex justify-end">
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? 'Edit Payment' : 'Add New Payment'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={newPayment.currency} onValueChange={(value) => setNewPayment({...newPayment, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_type">Payment Type</Label>
                  <Select value={newPayment.payment_type} onValueChange={(value) => setNewPayment({...newPayment, payment_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tuition">Tuition</SelectItem>
                      <SelectItem value="materials">Materials</SelectItem>
                      <SelectItem value="exam_fee">Exam Fee</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select value={newPayment.payment_method} onValueChange={(value) => setNewPayment({...newPayment, payment_method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newPayment.due_date}
                  onChange={(e) => setNewPayment({...newPayment, due_date: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                  placeholder="Additional notes about this payment"
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <label className="flex items-start gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    required
                    className="mt-1 accent-primary"
                  />
                  <span>
                    I have read and agree to the{' '}
                    <Link to="/terms-of-service" className="text-primary underline" target="_blank">Terms of Service</Link>{' '}and{' '}
                    <Link to="/cancellation-policy" className="text-primary underline" target="_blank">Cancellation Policy</Link>.
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={mediaConsent}
                    onChange={e => setMediaConsent(e.target.checked)}
                    className="mt-1 accent-primary"
                  />
                  <span>
                    I grant Damon Music Academy permission to use photos/videos of me (or my child) for promotional purposes as described in the{' '}
                    <Link to="/media-release-policy" className="text-primary underline" target="_blank">Media Release Policy</Link>.
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!agreedToTerms}>
                  {editingPayment ? 'Update Payment' : 'Add Payment'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>View and manage all payment records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.length > 0 ? (
              payments.map(payment => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold">{payment.payment_type}</h4>
                      <p className="text-sm text-gray-600">Student: {payment.student_name}</p>
                      <p className="text-sm text-gray-600">Due: {formatDate(payment.due_date)}</p>
                      {payment.paid_date && (
                        <p className="text-sm text-gray-600">Paid: {formatDate(payment.paid_date)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold">{formatCurrency(payment.amount, payment.currency)}</div>
                      <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {payment.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onMarkAsPaid(payment.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No payment records found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Invoices</span>
                <span className="font-semibold">{payments.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid Amount</span>
                <span className="font-semibold text-green-600">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Amount</span>
                <span className="font-semibold text-yellow-600">{formatCurrency(totalPending)}</span>
              </div>
              <div className="flex justify-between">
                <span>Overdue Amount</span>
                <span className="font-semibold text-red-600">{formatCurrency(totalOverdue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['cash', 'mpesa', 'bank_transfer', 'card'].map(method => {
                const methodPayments = payments.filter(p => p.payment_method === method);
                const methodTotal = methodPayments.reduce((acc, p) => acc + p.amount, 0);
                return (
                  <div key={method} className="flex justify-between">
                    <span className="capitalize">{method.replace('_', ' ')}</span>
                    <span className="font-semibold">{formatCurrency(methodTotal)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentManager; 