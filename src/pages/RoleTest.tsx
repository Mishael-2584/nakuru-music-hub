import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const RoleTest = () => {
  const { user, isAuthenticated } = useAuth();
  const [roleInfo, setRoleInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRoleDetermination = async () => {
    if (!user) return;
    
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Check profiles table
      console.log('🔍 Testing profiles table...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      results.profiles = { data: profile, error: profileError };

      // Test 2: Check teachers table
      console.log('🔍 Testing teachers table...');
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', user.email)
        .single();
      
      results.teachers = { data: teacher, error: teacherError };

      // Test 3: Check pending_teachers table
      console.log('🔍 Testing pending_teachers table...');
      const { data: pendingTeacher, error: pendingError } = await supabase
        .from('pending_teachers')
        .select('*')
        .eq('email', user.email)
        .single();
      
      results.pendingTeachers = { data: pendingTeacher, error: pendingError };

      // Test 4: Check registrations table
      console.log('🔍 Testing registrations table...');
      const { data: registration, error: registrationError } = await supabase
        .from('registrations')
        .select('*')
        .eq('email', user.email)
        .single();
      
      results.registrations = { data: registration, error: registrationError };

      // Test 5: Check user metadata
      results.userMetadata = user.user_metadata;

      setRoleInfo(results);
      console.log('📊 All test results:', results);

    } catch (error) {
      console.error('❌ Error during testing:', error);
      setRoleInfo({ error: error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      testRoleDetermination();
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Role Test</h1>
          <p>Please log in to test role determination.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Role Determination Test</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">User Info</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>ID:</strong> {user?.id}</p>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Testing role determination...</p>
          </div>
        )}

        {roleInfo && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Profiles Table</h2>
              <div className="bg-gray-100 p-4 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(roleInfo.profiles, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Teachers Table</h2>
              <div className="bg-gray-100 p-4 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(roleInfo.teachers, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Pending Teachers Table</h2>
              <div className="bg-gray-100 p-4 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(roleInfo.pendingTeachers, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Registrations Table</h2>
              <div className="bg-gray-100 p-4 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(roleInfo.registrations, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">User Metadata</h2>
              <div className="bg-gray-100 p-4 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(roleInfo.userMetadata, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <button 
            onClick={testRoleDetermination}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Re-run Tests
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleTest; 