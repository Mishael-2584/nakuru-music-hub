
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/auth/AuthForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Music } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, isInitialized } = useAuth();
  const [redirectHandled, setRedirectHandled] = useState(false);

  useEffect(() => {
    // Only redirect after auth is fully initialized, user is authenticated, and we haven't redirected yet
    if (isInitialized && !loading && isAuthenticated && user && !redirectHandled) {
      console.log("User is authenticated, redirecting to admin");
      setRedirectHandled(true);
      navigate("/admin", { replace: true });
    }
  }, [user, loading, isAuthenticated, isInitialized, navigate, redirectHandled]);

  const handleAuthSuccess = () => {
    console.log("Auth success - will redirect when state updates");
    // Reset redirect handled so the useEffect can handle the redirect
    setRedirectHandled(false);
  };

  // Show loading while auth is initializing
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/20 to-muted/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center animate-pulse">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // If user is authenticated and we haven't redirected yet, show loading
  if (isAuthenticated && user && !redirectHandled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/20 to-muted/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center animate-pulse">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div className="text-lg text-muted-foreground">Redirecting to dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <Header />
      <div className="container mx-auto px-4 py-8 sm:py-16 lg:py-24">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 sm:p-4 bg-gradient-to-r from-primary to-accent rounded-full">
              <Music className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Admin Access
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
            Sign in to access the admin panel and manage registrations
          </p>
        </div>
        <AuthForm onSuccess={handleAuthSuccess} />
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
