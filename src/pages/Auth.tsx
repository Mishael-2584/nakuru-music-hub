import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/auth/AuthForm";
import { Music, ShieldCheck, Users, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const roleOptions = [
  { value: "admin", label: "Admin", icon: ShieldCheck },
  { value: "student", label: "Student", icon: Users },
  { value: "teacher", label: "Teacher", icon: GraduationCap },
];

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, isInitialized } = useAuth();
  const [redirectHandled, setRedirectHandled] = useState(false);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [determiningRole, setDeterminingRole] = useState(false);

  // Function to determine user's actual role from database
  const determineUserRole = async (userId: string): Promise<string> => {
    try {
      setDeterminingRole(true);
      
      // First try to get role from profiles table (for admins/teachers)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile && !profileError) {
        console.log('User role from profiles:', profile.role);
        return profile.role || 'student';
      }

      // If not in profiles, check if user is a student by looking in registrations
      const { data: registration, error: registrationError } = await supabase
        .from('registrations')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (registration && !registrationError) {
        console.log('User is a student (found in registrations)');
        return 'student';
      }

      // Check user metadata as fallback
      if (user?.user_metadata?.role) {
        console.log('User role from metadata:', user.user_metadata.role);
        return user.user_metadata.role;
      }

      // Default to student if no role found
      console.log('No role found, defaulting to student');
      return 'student';
    } catch (error) {
      console.error('Error determining user role:', error);
      // Default to student for security
      return 'student';
    } finally {
      setDeterminingRole(false);
    }
  };

  useEffect(() => {
    if (isInitialized && !loading && isAuthenticated && user && !redirectHandled && !determiningRole) {
      setRedirectHandled(true);
      
      // Determine user's actual role and redirect accordingly
      determineUserRole(user.id).then((actualRole) => {
        console.log('Redirecting user with role:', actualRole);
        
        if (actualRole === "admin" || actualRole === "super_admin") {
          navigate("/admin", { replace: true });
        } else if (actualRole === "student") {
          navigate("/student", { replace: true });
        } else if (actualRole === "teacher") {
          navigate("/teacher", { replace: true });
        } else {
          // Default to student portal for security
          console.warn('Unknown role, redirecting to student portal');
          navigate("/student", { replace: true });
        }
      });
    }
  }, [user, loading, isAuthenticated, isInitialized, navigate, redirectHandled, determiningRole]);

  const handleAuthSuccess = () => {
    setRedirectHandled(false);
  };

  if (!isInitialized || loading || determiningRole || (isAuthenticated && user && !redirectHandled)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center animate-pulse">
            <Music className="h-8 w-8 text-white" />
          </div>
          <div className="text-lg text-muted-foreground font-semibold">
            {determiningRole ? "Determining your role..." : (isAuthenticated ? "Authenticating..." : "Loading Portal...")}
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
        <div className="mb-6 w-full max-w-xs">
          <div className="flex justify-center gap-2 mb-4">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.value}
                  className={`flex flex-col items-center px-4 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none ${selectedRole === role.value ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 bg-white text-gray-700'} hover:border-primary`}
                  onClick={() => setSelectedRole(role.value)}
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
      </div>
    </div>
  );
};

export default Auth;