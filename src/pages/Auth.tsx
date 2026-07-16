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
  const passwordUpdated = searchParams.get('password_updated') === 'true';

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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 lg:grid lg:grid-cols-2 overflow-hidden">
      {/* Left side - Clean Branding */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white p-8 relative">
        {/* Subtle background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5"></div>
        <div className="absolute top-8 left-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-8 right-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
        
        <div className="max-w-sm text-center relative z-10">
          {/* Clean Logo Section */}
          <Link to="/" className="group block mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur-md group-hover:blur-lg transition-all duration-300"></div>
              <div className="relative bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-500/20">
                <img 
                  src="/damon-logo.png" 
                  alt="Damon Music Academy Logo" 
                  className="h-20 mx-auto transition-transform duration-300 group-hover:rotate-2" 
                />
              </div>
            </div>
          </Link>
          
          {/* Clean Typography */}
          <h1 className="text-4xl font-bold mb-4 text-white">
            Music Academy Portal
          </h1>
          <p className="text-lg text-slate-300 mb-8 leading-relaxed">
            Access your personalized dashboard as an Admin, Student, or Teacher.
          </p>
          
          {/* Clean Feature Cards */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-5 h-5 text-blue-300" />
              </div>
              <span className="text-sm font-medium text-slate-200">Secure, role-based access for all users.</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Music className="w-5 h-5 text-indigo-300" />
              </div>
              <span className="text-sm font-medium text-slate-200">All your creative content, managed in one place.</span>
            </div>
          </div>
        </div>
      </div>
      
             {/* Right side - Clean Auth Form */}
       <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-white/60 backdrop-blur-sm h-full overflow-y-auto">
         {/* Mobile Logo */}
         <div className="lg:hidden mb-6 text-center w-full">
           <Link to="/" className="group block">
             <div className="relative">
               <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg blur-md group-hover:blur-lg transition-all duration-300"></div>
               <div className="relative bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-md transition-all duration-300 group-hover:scale-105">
                 <img 
                   src="/damon-logo.png" 
                   alt="Damon Music Academy Logo" 
                   className="h-20 mx-auto transition-transform duration-300 group-hover:rotate-2" 
                 />
               </div>
             </div>
           </Link>
         </div>
        
        {/* Session Expired Alert */}
        {sessionExpired && (
          <Alert className="mb-6 w-full max-w-xs border-red-200 bg-red-50">
            <AlertDescription className="text-red-800 text-sm">
              Your session has expired. Please sign in again to continue.
            </AlertDescription>
          </Alert>
        )}

        {passwordUpdated && (
          <Alert className="mb-6 w-full max-w-xs border-green-200 bg-green-50">
            <AlertDescription className="text-green-800 text-sm">
              Password updated successfully. Please sign in with your new password.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Clean Role Selection */}
        <div className="mb-6 w-full max-w-xs">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Choose Your Role</h2>
          <div className="flex justify-center gap-2 mb-4">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.value}
                  className={`flex flex-col items-center px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    selectedRole === role.value 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedRole(role.value as "admin" | "student" | "teacher")}
                  type="button"
                >
                  <div className={`p-2 rounded-md mb-2 transition-all duration-200 ${
                    selectedRole === role.value 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold">{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        <AuthForm onSuccess={handleAuthSuccess} role={selectedRole} />
        
        {/* Force Sign Out Button for debugging */}
        {isAuthenticated && user && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm max-w-xs">
            <p className="text-xs text-yellow-800 mb-2">
              If you're stuck in a login loop, click the button below to force sign out:
            </p>
            <button
              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors duration-200"
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