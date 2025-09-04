import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const LearningModeDebugTest: React.FC = () => {
  const [results, setResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testFunction = async (functionName: string, params: any = {}) => {
    setLoading(true);
    try {
      console.log(`Testing ${functionName} with params:`, params);
      
      const { data, error } = await supabase.rpc(functionName, params);
      
      console.log(`${functionName} result:`, { data, error });
      
      const result = `\n=== ${functionName} ===\n` +
        `Error: ${error ? JSON.stringify(error, null, 2) : 'None'}\n` +
        `Data: ${data ? JSON.stringify(data, null, 2) : 'None'}\n` +
        `Auth user: ${supabase.auth.getUser ? 'Available' : 'Not Available'}\n`;
        
      setResults(prev => prev + result);
    } catch (err) {
      console.error(`Error testing ${functionName}:`, err);
      setResults(prev => prev + `\n=== ${functionName} ERROR ===\n${err.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const checkAuthAndUser = async () => {
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      console.log('Auth check:', { user, error });
      
      const result = `\n=== AUTH CHECK ===\n` +
        `User: ${user ? JSON.stringify(user, null, 2) : 'None'}\n` +
        `Error: ${error ? JSON.stringify(error, null, 2) : 'None'}\n`;
        
      setResults(prev => prev + result);

      // If user exists, check their profile
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        const profileResult = `\n=== PROFILE CHECK ===\n` +
          `Profile: ${profile ? JSON.stringify(profile, null, 2) : 'None'}\n` +
          `Error: ${profileError ? JSON.stringify(profileError, null, 2) : 'None'}\n`;
          
        setResults(prev => prev + profileResult);
      }
    } catch (err) {
      console.error('Error checking auth:', err);
      setResults(prev => prev + `\n=== AUTH ERROR ===\n${err.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectTableAccess = async () => {
    setLoading(true);
    try {
      // Test direct table access
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, student_name, learning_mode')
        .limit(5);
      
      // Note: learning_mode_change_requests table has been removed
      
      const result = `\n=== DIRECT TABLE ACCESS ===\n` +
        `Students: ${students ? JSON.stringify(students, null, 2) : 'None'}\n` +
        `Students Error: ${studentsError ? JSON.stringify(studentsError, null, 2) : 'None'}\n` +
        `Note: learning_mode_change_requests table has been removed\n`;
        
      setResults(prev => prev + result);
    } catch (err) {
      console.error('Error with direct access:', err);
      setResults(prev => prev + `\n=== DIRECT ACCESS ERROR ===\n${err.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults('');
  };

  return (
    <Card className="max-w-4xl mx-auto m-4">
      <CardHeader>
        <CardTitle>Learning Mode Requests Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={checkAuthAndUser} 
            disabled={loading}
            variant="outline"
          >
            Check Auth & User
          </Button>
          
          <Button 
            onClick={testDirectTableAccess} 
            disabled={loading}
            variant="outline"
          >
            Test Direct Table Access
          </Button>
          
          {/* Learning mode request functions have been removed */}
          <Button 
            onClick={() => setResults(prev => prev + "\n=== NOTICE ===\nLearning mode request functions have been removed\n")} 
            disabled={loading}
            variant="secondary"
          >
            Learning Mode Functions Removed
          </Button>
          
          <Button 
            onClick={clearResults} 
            disabled={loading}
            variant="ghost"
          >
            Clear Results
          </Button>
        </div>
        
        {loading && <div>Loading...</div>}
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <h4 className="font-bold mb-2">Test Results:</h4>
          <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
            {results || 'Click a test button to see results'}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningModeDebugTest;
