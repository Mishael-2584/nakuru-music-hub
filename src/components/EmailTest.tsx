import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

export default function EmailTest() {
  const [testEmail, setTestEmail] = useState('mishaelgebre@gmail.com');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testEmailService = async () => {
    setIsLoading(true);
    setResult('Testing email service...');
    
    try {
      console.log('🧪 Testing email service...');
      
      const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          to: testEmail,
          subject: '🧪 Email Service Test - Damon Music Academy',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333;">🧪 Email Service Test</h1>
              <p>This is a test email to verify that the email service is working correctly.</p>
              <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
              <p>If you received this email, the email service is working properly!</p>
              <hr>
              <p style="color: #666; font-size: 12px;">
                Damon Music Academy<br>
                Email Service Test
              </p>
            </div>
          `
        }
      });

      if (error) {
        console.error('❌ Email test failed:', error);
        setResult(`❌ Email test failed: ${error.message}`);
        return;
      }

      console.log('📧 Email test response:', data);
      
      if (data && data.success) {
        setResult(`✅ Email test successful! Email ID: ${data.id || 'N/A'}`);
      } else {
        setResult(`❌ Email test failed: ${data?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('❌ Email test error:', error);
      setResult(`❌ Email test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testInvoiceEmail = async () => {
    setIsLoading(true);
    setResult('Testing invoice email...');
    
    try {
      console.log('🧪 Testing invoice email...');
      
      // Create a mock invoice and student for testing
      const mockInvoice = {
        id: 'test-invoice-id',
        student_id: 'test-student-id',
        amount_due: 4800,
        period_start: '2025-07-31',
        period_end: '2025-08-30',
        due_date: '2025-08-09',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        fee_id: 'test-fee-id',
        is_auto_generated: true,
        admin_override: false,
        notes: 'Test invoice'
      };

      const mockStudent = {
        id: 'test-student-id',
        student_name: 'Test Student',
        email: testEmail,
        phone: '+254701195460',
        registration_id: 'test-registration-id'
      };

      const { sendInvoiceEmail } = await import('@/lib/emailService');
      const sent = await sendInvoiceEmail(mockInvoice, mockStudent, { isReminder: false });
      
      if (sent) {
        setResult('✅ Invoice email test successful!');
      } else {
        setResult('❌ Invoice email test failed');
      }
      
    } catch (error) {
      console.error('❌ Invoice email test error:', error);
      setResult(`❌ Invoice email test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Email Service Test</CardTitle>
          <CardDescription>
            Test the email service to ensure invoices are being sent correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testEmail">Test Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email address to test"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testEmailService} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Testing...' : 'Test Basic Email'}
            </Button>
            
            <Button 
              onClick={testInvoiceEmail} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Testing...' : 'Test Invoice Email'}
            </Button>
          </div>
          
          {result && (
            <div className={`p-4 rounded-md ${
              result.includes('✅') 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          )}
          
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>What this tests:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Basic email service connectivity</li>
              <li>RESEND_API_KEY configuration</li>
              <li>Invoice email with PDF attachment</li>
              <li>Edge function deployment</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 