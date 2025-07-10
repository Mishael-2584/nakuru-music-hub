import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

const initialFee = {
  course_type: '',
  course_name: '',
  price: 0,
  duration: '',
  description: '',
  level: '',
  payment_frequency: '',
  mode: '',
  sessions_per_week: 1,
  hours_per_session: 1.0,
  currency: 'KSh',
  payment_type: 'monthly',
  is_active: true,
};

const AdminFeesManager: React.FC = () => {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState<any | null>(null);
  const [form, setForm] = useState<any>(initialFee);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('fees').select('*').order('course_type', { ascending: true });
    if (!error && data) setFees(data);
    setLoading(false);
  };

  const handleEdit = (fee: any) => {
    setEditingFee(fee);
    setForm(fee);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this fee?')) return;
    await supabase.from('fees').delete().eq('id', id);
    fetchFees();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFee) {
      await supabase.from('fees').update(form).eq('id', editingFee.id);
    } else {
      await supabase.from('fees').insert(form);
    }
    setShowModal(false);
    setEditingFee(null);
    setForm(initialFee);
    fetchFees();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/95">
      <CardHeader>
        <CardTitle>Manage Course Fees</CardTitle>
        <Button onClick={() => { setEditingFee(null); setForm(initialFee); setShowModal(true); }}>
          Add New Fee
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? <div>Loading...</div> : (
          <table className="min-w-full text-sm mb-6">
            <thead>
              <tr>
                <th>Course Type</th>
                <th>Course Name</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Mode</th>
                <th>Level</th>
                <th>Payment Type</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.map(fee => (
                <tr key={fee.id}>
                  <td>{fee.course_type}</td>
                  <td>{fee.course_name}</td>
                  <td>{fee.currency} {fee.price.toLocaleString()}</td>
                  <td>{fee.duration}</td>
                  <td>{fee.mode}</td>
                  <td>{fee.level}</td>
                  <td>{fee.payment_type}</td>
                  <td>{fee.is_active ? 'Yes' : 'No'}</td>
                  <td>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(fee)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(fee.id)} className="ml-2">Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFee ? 'Edit Fee' : 'Add New Fee'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input required placeholder="Course Type" value={form.course_type} onChange={e => setForm({ ...form, course_type: e.target.value })} />
              <Input required placeholder="Course Name" value={form.course_name} onChange={e => setForm({ ...form, course_name: e.target.value })} />
              <Input required type="number" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} />
              <Input required placeholder="Duration" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
              <Input placeholder="Mode" value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })} />
              <Input placeholder="Level" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} />
              <Input placeholder="Payment Frequency" value={form.payment_frequency} onChange={e => setForm({ ...form, payment_frequency: e.target.value })} />
              <Input placeholder="Sessions/Week" type="number" value={form.sessions_per_week} onChange={e => setForm({ ...form, sessions_per_week: parseInt(e.target.value) })} />
              <Input placeholder="Hours/Session" type="number" value={form.hours_per_session} onChange={e => setForm({ ...form, hours_per_session: parseFloat(e.target.value) })} />
              <Input placeholder="Currency" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} />
              <Input placeholder="Payment Type" value={form.payment_type} onChange={e => setForm({ ...form, payment_type: e.target.value })} />
              <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div className="flex items-center gap-2">
                <label>Active</label>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit">{editingFee ? 'Update' : 'Add'}</Button>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminFeesManager; 