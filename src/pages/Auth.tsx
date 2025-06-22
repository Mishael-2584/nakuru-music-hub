import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/auth/AuthForm";
import { Music, ShieldCheck } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, isInitialized } = useAuth();
  const [redirectHandled, setRedirectHandled] = useState(false);

  useEffect(() => {
    if (isInitialized && !loading && isAuthenticated && user && !redirectHandled) {
      setRedirectHandled(true);
      navigate("/admin", { replace: true });
    }
  }, [user, loading, isAuthenticated, isInitialized, navigate, redirectHandled]);

  const handleAuthSuccess = () => {
    setRedirectHandled(false);
  };

  if (!isInitialized || loading || (isAuthenticated && user && !redirectHandled)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center animate-pulse">
            <Music className="h-8 w-8 text-white" />
          </div>
          <div className="text-lg text-muted-foreground font-semibold">
            {isAuthenticated ? "Authenticating..." : "Loading Portal..."}
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
            <img src="/damon-logo.png" alt="Damon Music Academy Logo" className="h-20 mx-auto mb-8 bg-white/10 rounded-lg p-2" />
          <h1 className="text-4xl font-bold mb-4">Admin Control Panel</h1>
          <p className="text-gray-300 mb-8">
            Manage your academy's events, news, and registrations with ease.
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <span>Secure, role-based access for administrators.</span>
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
            <img src="/damon-logo.png" alt="Damon Music Academy Logo" className="h-16 mx-auto mb-4" />
        </div>
        <AuthForm onSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
};

export default Auth;