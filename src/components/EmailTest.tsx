import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sendConfirmationEmail, quickEmailTest, testFullRegistrationEmail } from '@/lib/emailService';
import { supabase } from '@/integrations/supabase/client';

export default function EmailTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const runQuickTest = async () => {
    setIsLoading(true);
    setResult('');
    setError('');
    
    try {
      console.log('🧪 Starting quick email test...');
      await quickEmailTest('mishaelgebre@gmail.com');
      setResult('Quick test completed. Check console for details.');
    } catch (err) {
      console.error('❌ Quick test error:', err);
      setError(`Quick test failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runFullTest = async () => {
    setIsLoading(true);
    setResult('');
    setError('');
    
    try {
      console.log('🧪 Starting full registration email test...');
      await testFullRegistrationEmail();
      setResult('Full test completed. Check console for details.');
    } catch (err) {
      console.error('❌ Full test error:', err);
      setError(`Full test failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    setResult('');
    setError('');
    
    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Test basic connection
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🔍 Auth test:', { user: !!user, error: authError });
      
      // Test function invocation
      const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
        body: { test: true }
      });
      
      console.log('🔍 Function test:', { data, error });
      
      if (error) {
        setError(`Function test failed: ${error.message}`);
      } else {
        setResult('Supabase connection and function test completed. Check console for details.');
      }
    } catch (err) {
      console.error('❌ Connection test error:', err);
      setError(`Connection test failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectFunction = async () => {
    setIsLoading(true);
    setResult('');
    setError('');
    
    try {
      console.log('📧 Testing direct function call...');
      
      const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          to: 'mishaelgebre@gmail.com',
          subject: 'Direct Test - Damon Music Academy',
          html: '<h1>Direct Test</h1><p>This is a direct test of the email function.</p>',
          registration: { id: 'direct-test', receipt_number: 'DIRECT-001' }
        }
      });
      
      console.log('📧 Direct function result:', { data, error });
      
      if (error) {
        setError(`Direct function failed: ${error.message}`);
      } else if (data?.success) {
        setResult('Direct function test successful! Check your email.');
      } else {
        setError(`Direct function failed: ${data?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Direct function error:', err);
      setError(`Direct function error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Email Service Debug Tool</CardTitle>
          <CardDescription>
            Test the email service to identify issues with the "being configured" message.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={testSupabaseConnection}
              disabled={isLoading}
              variant="outline"
            >
              🔍 Test Supabase Connection
            </Button>
            
            <Button 
              onClick={testDirectFunction}
              disabled={isLoading}
              variant="outline"
            >
              📧 Test Direct Function
            </Button>
            
            <Button 
              onClick={runQuickTest}
              disabled={isLoading}
              variant="outline"
            >
              ⚡ Quick Email Test
            </Button>
            
            <Button 
              onClick={runFullTest}
              disabled={isLoading}
              variant="outline"
            >
              📋 Full Registration Test
            </Button>
          </div>

          {isLoading && (
            <Alert>
              <AlertDescription>
                🔄 Running test... Please wait and check the browser console for detailed logs.
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                ✅ {result}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                ❌ {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">📋 Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Open your browser's Developer Tools (F12)</li>
              <li>Go to the Console tab</li>
              <li>Click any test button above</li>
              <li>Watch the console for detailed logs</li>
              <li>Check your email at: mishaelgebre@gmail.com</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">🔧 What to Look For:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>📧 Email function logs starting with "📧"</li>
              <li>❌ Error messages starting with "❌"</li>
              <li>✅ Success messages starting with "✅"</li>
              <li>🔍 Connection test results</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 