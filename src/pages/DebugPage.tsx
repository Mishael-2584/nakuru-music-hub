import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const DebugPage = () => {
  const [debugData, setDebugData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const runDebugChecks = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('🔍 Running debug checks...');
      
      // Run the debug function
      const { data, error } = await supabase
        .rpc('debug_teacher_slots_data');
      
      if (error) {
        console.error('❌ Debug function error:', error);
        setMessage('Error running debug checks: ' + error.message);
        return;
      }
      
      console.log('✅ Debug data:', data);
      setDebugData(data || []);
      setMessage('Debug checks completed successfully!');
      
    } catch (error) {
      console.error('❌ Error in debug checks:', error);
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fixTeacherStatus = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase
        .rpc('fix_teacher_status');
      
      if (error) {
        console.error('❌ Fix teacher status error:', error);
        setMessage('Error fixing teacher status: ' + error.message);
        return;
      }
      
      console.log('✅ Fix teacher status result:', data);
      setMessage('Teacher status fixed: ' + data);
      
    } catch (error) {
      console.error('❌ Error fixing teacher status:', error);
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const syncTeacherUserIds = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase
        .rpc('sync_teacher_user_ids');
      
      if (error) {
        console.error('❌ Sync teacher user IDs error:', error);
        setMessage('Error syncing teacher user IDs: ' + error.message);
        return;
      }
      
      console.log('✅ Sync teacher user IDs result:', data);
      setMessage('Teacher user IDs synced: ' + data);
      
    } catch (error) {
      console.error('❌ Error syncing teacher user IDs:', error);
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase
        .rpc('create_sample_teacher_data');
      
      if (error) {
        console.error('❌ Create sample data error:', error);
        setMessage('Error creating sample data: ' + error.message);
        return;
      }
      
      console.log('✅ Create sample data result:', data);
      setMessage('Sample data created: ' + data);
      
    } catch (error) {
      console.error('❌ Error creating sample data:', error);
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testTimeSlotFunction = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase
        .rpc('test_time_slot_function');
      
      if (error) {
        console.error('❌ Test time slot function error:', error);
        setMessage('Error testing time slot function: ' + error.message);
        return;
      }
      
      console.log('✅ Test time slot function result:', data);
      setDebugData(data || []);
      setMessage('Time slot function test completed!');
      
    } catch (error) {
      console.error('❌ Error testing time slot function:', error);
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createTestTimeSlots = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase
        .rpc('create_test_time_slots');
      
      if (error) {
        console.error('❌ Create test time slots error:', error);
        setMessage('Error creating test time slots: ' + error.message);
        return;
      }
      
      console.log('✅ Create test time slots result:', data);
      setMessage('Test time slots created: ' + data);
      
    } catch (error) {
      console.error('❌ Error creating test time slots:', error);
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verifyAndCreateTimeSlots = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase
        .rpc('verify_and_create_time_slots');
      
      if (error) {
        console.error('❌ Verify and create time slots error:', error);
        setMessage('Error verifying and creating time slots: ' + error.message);
        return;
      }
      
      console.log('✅ Verify and create time slots result:', data);
      setMessage('Time slots verification: ' + data);
      
    } catch (error) {
      console.error('❌ Error verifying and creating time slots:', error);
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getDataSummary = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase
        .rpc('get_data_summary');
      
      if (error) {
        console.error('❌ Get data summary error:', error);
        setMessage('Error getting data summary: ' + error.message);
        return;
      }
      
      console.log('✅ Get data summary result:', data);
      setDebugData(data || []);
      setMessage('Data summary retrieved successfully!');
      
    } catch (error) {
      console.error('❌ Error getting data summary:', error);
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testMakeupCredits = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // First get the current user's student ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('No authenticated user found');
        return;
      }

      // Get student profile
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError || !student) {
        setMessage('No student profile found for current user');
        return;
      }

      console.log('🧪 Testing makeup credits for student:', student.id);

      // Test makeup credits function
      const { data, error } = await supabase
        .rpc('get_student_makeup_credits', { student_id_param: student.id });
      
      if (error) {
        console.error('❌ Test makeup credits error:', error);
        setMessage('Error testing makeup credits: ' + error.message);
        return;
      }
      
      console.log('✅ Test makeup credits result:', data);
      setDebugData(data || []);
      setMessage(`Makeup credits test completed! Found ${data?.length || 0} credits`);
      
    } catch (error) {
      console.error('❌ Error testing makeup credits:', error);
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testCancellationLimits = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // First get the current user's student ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('No authenticated user found');
        return;
      }

      // Get student profile
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError || !student) {
        setMessage('No student profile found for current user');
        return;
      }

      console.log('🧪 Testing cancellation limits for student:', student.id);

      // Test cancellation limits
      const { data: canCancel, error: cancelError } = await supabase
        .rpc('can_student_cancel', { student_id_param: student.id });
      
      if (cancelError) {
        console.error('❌ Test cancellation limits error:', cancelError);
        setMessage('Error testing cancellation limits: ' + cancelError.message);
        return;
      }
      
      // Test makeup credit limits
      const { data: canReceive, error: receiveError } = await supabase
        .rpc('can_receive_makeup_credit', { student_id_param: student.id });
      
      if (receiveError) {
        console.error('❌ Test makeup credit limits error:', receiveError);
        setMessage('Error testing makeup credit limits: ' + receiveError.message);
        return;
      }
      
      console.log('✅ Cancellation limits result:', canCancel);
      console.log('✅ Makeup credit limits result:', canReceive);
      
      setDebugData([canCancel, canReceive]);
      setMessage(`Cancellation limits test completed! Can cancel: ${canCancel?.can_cancel}, Can receive credit: ${canReceive?.can_receive}`);
      
    } catch (error) {
      console.error('❌ Error testing cancellation limits:', error);
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testExpirationLogic = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('🧪 Testing expiration logic...');
      
      // Test the get_end_of_month function with different dates
      const testDates = [
        '2025-08-15', // August 15th
        '2025-09-03', // September 3rd
        '2025-12-25', // December 25th
        '2025-02-14'  // February 14th
      ];
      
      const results = [];
      
      for (const testDate of testDates) {
        const { data, error } = await supabase
          .rpc('get_end_of_month', { input_date: testDate });
        
        if (error) {
          console.error(`❌ Error testing date ${testDate}:`, error);
          results.push({ date: testDate, error: error.message });
        } else {
          console.log(`✅ ${testDate} expires at: ${data}`);
          results.push({ date: testDate, expires_at: data });
        }
      }
      
      console.log('✅ Expiration logic test results:', results);
      setDebugData(results);
      setMessage(`Expiration logic test completed! Tested ${testDates.length} dates`);
      
    } catch (error) {
      console.error('❌ Error testing expiration logic:', error);
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testMakeupCreditUsage = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // First get the current user's student ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('No authenticated user found');
        return;
      }

      // Get student profile
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError || !student) {
        setMessage('No student profile found for current user');
        return;
      }

      console.log('🧪 Testing makeup credit usage for student:', student.id);

      // Get available makeup credits
      const { data: credits, error: creditsError } = await supabase
        .rpc('get_student_makeup_credits', { student_id_param: student.id });
      
      if (creditsError) {
        console.error('❌ Error getting makeup credits:', creditsError);
        setMessage('Error getting makeup credits: ' + creditsError.message);
        return;
      }

      const availableCredits = credits?.filter(c => !c.is_used && c.days_until_expiry > 0) || [];
      
      if (availableCredits.length === 0) {
        setMessage('No available makeup credits to test with');
        return;
      }

      console.log('✅ Available credits:', availableCredits);
      setDebugData(availableCredits);
      setMessage(`Found ${availableCredits.length} available makeup credits. The system is ready to use them for bookings!`);
      
    } catch (error) {
      console.error('❌ Error testing makeup credit usage:', error);
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const checkMakeupCreditsTable = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('🔍 Checking makeup_credits table...');
      
      // Check if we can access the makeup_credits table directly
      const { data, error } = await supabase
        .from('makeup_credits')
        .select('*')
        .limit(5);
      
      if (error) {
        console.error('❌ Error accessing makeup_credits table:', error);
        setMessage('Error accessing makeup_credits table: ' + error.message);
        return;
      }
      
      console.log('✅ Makeup_credits table accessible:', data);
      setDebugData(data || []);
      setMessage(`Makeup_credits table check completed! Found ${data?.length || 0} records`);
      
    } catch (error) {
      console.error('❌ Error checking makeup_credits table:', error);
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Button 
          onClick={runDebugChecks} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Running...' : 'Run Debug Checks'}
        </Button>
        
        <Button 
          onClick={fixTeacherStatus} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Fixing...' : 'Fix Teacher Status'}
        </Button>
        
        <Button 
          onClick={syncTeacherUserIds} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Syncing...' : 'Sync Teacher User IDs'}
        </Button>
        
        <Button 
          onClick={createSampleData} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Sample Data'}
        </Button>
        
        <Button 
          onClick={testTimeSlotFunction} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Time Slot Function'}
        </Button>
        
        <Button 
          onClick={createTestTimeSlots} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Test Time Slots'}
        </Button>
        
        <Button 
          onClick={verifyAndCreateTimeSlots} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Verifying...' : 'Verify & Create Time Slots'}
        </Button>
        
        <Button 
          onClick={getDataSummary} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Loading...' : 'Get Data Summary'}
        </Button>
        
        <Button 
          onClick={testMakeupCredits} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Makeup Credits'}
        </Button>
        
        <Button 
          onClick={checkMakeupCreditsTable} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Checking...' : 'Check Makeup Credits Table'}
        </Button>
        
        <Button 
          onClick={testCancellationLimits} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Cancellation Limits'}
        </Button>
        
        <Button 
          onClick={testExpirationLogic} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Expiration Logic'}
        </Button>
        
        <Button 
          onClick={testMakeupCreditUsage} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Makeup Credit Usage'}
        </Button>
      </div>

      {message && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-sm">{message}</p>
          </CardContent>
        </Card>
      )}

      {debugData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {debugData.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{item.check_type}</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div><strong>Result:</strong> {item.result}</div>
                    <div><strong>Count:</strong> {item.count}</div>
                  </div>
                  <p className="text-gray-600 mt-2">{item.details}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DebugPage; 