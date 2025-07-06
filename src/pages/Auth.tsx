import { useEffect, useState, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/auth/AuthForm";
import { Music, ShieldCheck, Users, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const roleOptions = [
  { value: "admin", label: "Admin", icon: ShieldCheck },
  { value: "student", label: "Student", icon: Users },
  { value: "teacher", label: "Teacher", icon: GraduationCap },
];

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, isAuthenticated, isInitialized, signOut } = useAuth();
  const [redirectHandled, setRedirectHandled] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "student" | "teacher">("admin");
  const [determiningRole, setDeterminingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const roleAttempts = useRef(0);
  const redirectInProgress = useRef(false);
  const MAX_ROLE_ATTEMPTS = 3;
  
  // Check if user was redirected due to session expiration
  const sessionExpired = searchParams.get('session_expired') === 'true';

  // Function to determine user's actual role from database
  const determineUserRole = async (userId: string): Promise<string> => {
    try {
      setDeterminingRole(true);
      console.log('🔍 Starting role determination for user:', userId);
      
      // ALWAYS check profiles table first - this is the authoritative source
      console.log('📋 Checking profiles table...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile && !profileError) {
        console.log('✅ User role from profiles:', profile.role);
        // If we have a role in profiles, use it and don't check other tables
        return profile.role || 'student';
      } else {
        console.log('❌ Profile not found or error:', profileError);
      }

      // Only check other tables if NO profile exists
      // Check if user is a teacher in teachers table
      console.log('👨‍🏫 Checking teachers table...');
      try {
        const { data: approvedTeacher, error: approvedTeacherError } = await supabase
          .from('teachers')
          .select('status')
          .eq('email', user?.email)
          .single();

        if (approvedTeacher && !approvedTeacherError) {
          console.log('✅ User is an approved teacher (found in teachers table)');
          return 'teacher';
        } else {
          console.log('❌ Not found in teachers table:', approvedTeacherError);
        }
      } catch (error) {
        console.log('❌ Error checking teachers table:', error);
      }

      // If not in profiles or teacher tables, check if user is a student by looking in registrations
      console.log('👨‍🎓 Checking registrations table...');
      try {
        const { data: registration, error: registrationError } = await supabase
          .from('registrations')
          .select('id')
          .eq('email', user?.email)
          .single();

        if (registration && !registrationError) {
          console.log('✅ User is a student (found in registrations)');
          return 'student';
        } else {
          console.log('❌ Not found in registrations table:', registrationError);
        }
      } catch (error) {
        console.log('❌ Error checking registrations table:', error);
      }

      // Check user metadata as fallback
      console.log('📝 Checking user metadata...');
      if (user?.user_metadata?.role) {
        console.log('✅ User role from metadata:', user.user_metadata.role);
        return user.user_metadata.role;
      } else {
        console.log('❌ No role in user metadata');
      }

      // Default to student if no role found
      console.log('⚠️ No role found, defaulting to student');
      return 'student';
    } catch (error) {
      console.error('❌ Error determining user role:', error);
      // Default to student for security
      return 'student';
    } finally {
      setDeterminingRole(false);
    }
  };

  useEffect(() => {
    if (isInitialized && !loading && isAuthenticated && user && !redirectHandled && !determiningRole && !redirectInProgress.current) {
      console.log('🔄 Starting redirect process...');
      redirectInProgress.current = true;
      setRedirectHandled(true);
      roleAttempts.current += 1;
      console.log(`📊 Role determination attempt: ${roleAttempts.current}/${MAX_ROLE_ATTEMPTS}`);
      
      // Add a small delay to ensure stable state
      setTimeout(() => {
        determineUserRole(user.id).then((actualRole) => {
          console.log(`🎯 Determined role: ${actualRole}`);
          
          if (!actualRole && roleAttempts.current >= MAX_ROLE_ATTEMPTS) {
            console.log('❌ Max attempts reached, showing error');
            setRoleError('Unable to determine your role. Please sign out and try again.');
            redirectInProgress.current = false;
            return;
          }
          
          if (actualRole === "admin" || actualRole === "super_admin") {
            console.log('🚀 Redirecting to admin dashboard');
            navigate("/admin", { replace: true });
          } else if (actualRole === "student") {
            console.log('🚀 Redirecting to student dashboard');
            navigate("/student", { replace: true });
          } else if (actualRole === "teacher") {
            console.log('🚀 Redirecting to teacher dashboard');
            navigate("/teacher", { replace: true });
          } else if (actualRole === "pending_teacher") {
            console.log('🚀 Redirecting to pending teacher page');
            navigate("/pending-teacher", { replace: true });
          } else {
            if (roleAttempts.current < MAX_ROLE_ATTEMPTS) {
              console.log('🔄 Role not found, trying again...');
              setRedirectHandled(false); // Try again
              redirectInProgress.current = false;
            } else {
              console.log('❌ Max attempts reached, showing error');
              setRoleError('Unable to determine your role. Please sign out and try again.');
              redirectInProgress.current = false;
            }
          }
        });
      }, 100); // Small delay to ensure stable state
    }
  }, [user, loading, isAuthenticated, isInitialized, navigate, redirectHandled, determiningRole]);

  const handleAuthSuccess = () => {
    setRedirectHandled(false);
    setRoleError(null);
    roleAttempts.current = 0;
    redirectInProgress.current = false;
  };

  const handleForceSignOut = async () => {
    await signOut();
    setRedirectHandled(false);
    setRoleError(null);
    roleAttempts.current = 0;
    navigate("/auth", { replace: true });
  };

  if (!isInitialized || loading || determiningRole || (isAuthenticated && user && !redirectHandled)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center animate-pulse">
            <Music className="h-8 w-8 text-white" />
          </div>
          <div className="text-lg text-muted-foreground font-semibold">
            {roleError ? (
              <>
                <div className="text-red-500 mb-2">{roleError}</div>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={handleForceSignOut}
                >
                  Force Sign Out
                </button>
              </>
            ) : (
              determiningRole ? "Determining your role..." : (isAuthenticated ? "Authenticating..." : "Loading Portal...")
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 lg:grid lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white p-12">
        <div className="max-w-md text-center">
            <Link to="/" className="group">
              <img src="/damon-logo.png" alt="Damon Music Academy Logo" className="h-20 mx-auto mb-8 bg-white/10 rounded-lg p-2 transition-transform duration-300 group-hover:scale-105 cursor-pointer" />
            </Link>
          <h1 className="text-4xl font-bold mb-4">Music Academy Portal</h1>
          <p className="text-gray-300 mb-8">
            Access your personalized dashboard as an Admin, Student, or Teacher.
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <span>Secure, role-based access for all users.</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-lg">
              <Music className="w-6 h-6 text-primary" />
              <span>All your creative content, managed in one place.</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth Form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="group">
              <img src="/damon-logo.png" alt="Damon Music Academy Logo" className="h-16 mx-auto mb-4 transition-transform duration-300 group-hover:scale-105 cursor-pointer" />
            </Link>
        </div>
        
        {/* Session Expired Alert */}
        {sessionExpired && (
          <Alert className="mb-6 w-full max-w-xs">
            <AlertDescription>
              Your session has expired. Please sign in again to continue.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mb-6 w-full max-w-xs">
          <div className="flex justify-center gap-2 mb-4">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.value}
                  className={`flex flex-col items-center px-4 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none ${selectedRole === role.value ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 bg-white text-gray-700'} hover:border-primary`}
                  onClick={() => setSelectedRole(role.value as "admin" | "student" | "teacher")}
                  type="button"
                >
                  <Icon className="h-6 w-6 mb-1" />
                  <span className="text-xs font-semibold">{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <AuthForm onSuccess={handleAuthSuccess} role={selectedRole} />
        
        {/* Force Sign Out Button for debugging */}
        {isAuthenticated && user && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              If you're stuck in a login loop, click the button below to force sign out:
            </p>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              onClick={handleForceSignOut}
            >
              Force Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;