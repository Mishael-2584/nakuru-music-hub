import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Fee {
  id: string;
  course_type: string;
  course_name: string;
  price: number;
  currency: string;
  payment_type: string;
  mode: string;
  is_active: boolean;
  created_at: string;
}

export default function FeeDebug() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchFees = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('fees')
        .select('*')
        .order('course_type', { ascending: true });
      
      if (error) {
        setError(`Error fetching fees: ${error.message}`);
        return;
      }
      
      setFees(data || []);
      console.log('📊 All fees in database:', data);
      
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFeeLookup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Test with a sample registration
      const testRegistration = {
        course_category: 'Music',
        instrument: 'Piano',
        learning_mode: 'online'
      };
      
      console.log('🧪 Testing fee lookup with:', testRegistration);
      
      const { data: exactFee, error: exactFeeError } = await supabase
        .from('fees')
        .select('*')
        .eq('course_type', testRegistration.course_category)
        .eq('course_name', testRegistration.instrument)
        .eq('mode', testRegistration.learning_mode)
        .eq('payment_type', 'monthly')
        .eq('is_active', true)
        .maybeSingle();
      
      console.log('🔍 Exact fee lookup result:', { exactFee, exactFeeError });
      
      if (!exactFee) {
        // Try fallback lookup
        const { data: fallbackFee, error: fallbackError } = await supabase
          .from('fees')
          .select('*')
          .eq('course_type', testRegistration.course_category)
          .eq('payment_type', 'monthly')
          .eq('is_active', true)
          .maybeSingle();
        
        console.log('🔄 Fallback fee lookup result:', { fallbackFee, fallbackError });
      }
      
    } catch (err) {
      setError(`Fee lookup test error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Fee Database Debug</CardTitle>
          <CardDescription>
            Debug fee lookup issues and check database contents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={fetchFees} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Loading...' : 'Refresh Fees'}
            </Button>
            
            <Button 
              onClick={testFeeLookup} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Testing...' : 'Test Fee Lookup'}
            </Button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
              <pre className="whitespace-pre-wrap text-sm">{error}</pre>
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">📊 All Fees in Database ({fees.length})</h3>
            
            {fees.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                ⚠️ No fees found in database. This is why invoice amounts are 0!
              </div>
            ) : (
              <div className="grid gap-4">
                {fees.map((fee) => (
                  <div key={fee.id} className="p-4 border rounded-md bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <strong>ID:</strong> {fee.id}
                      </div>
                      <div>
                        <strong>Course Type:</strong> {fee.course_type}
                      </div>
                      <div>
                        <strong>Course Name:</strong> {fee.course_name}
                      </div>
                      <div>
                        <strong>Mode:</strong> {fee.mode}
                      </div>
                      <div>
                        <strong>Payment Type:</strong> {fee.payment_type}
                      </div>
                      <div>
                        <strong>Price:</strong> {fee.price} {fee.currency}
                      </div>
                      <div>
                        <strong>Active:</strong> {fee.is_active ? '✅' : '❌'}
                      </div>
                      <div>
                        <strong>Created:</strong> {new Date(fee.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Common Issues:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>No fees:</strong> Database is empty - need to add fee data</li>
              <li><strong>Wrong course_type:</strong> Should match registration.course_category</li>
              <li><strong>Wrong course_name:</strong> Should match registration.instrument</li>
              <li><strong>Wrong mode:</strong> Should match registration.learning_mode</li>
              <li><strong>Price = 0:</strong> Fee exists but has zero price</li>
              <li><strong>Inactive fees:</strong> is_active = false</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 