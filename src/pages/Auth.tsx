
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/auth/AuthForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Music } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, initialized, isAuthenticated } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only check for redirect after auth is initialized and we haven't already redirected
    if (initialized && !loading && !hasRedirected) {
      if (isAuthenticated && user) {
        console.log("Auth page: User authenticated, redirecting to admin");
        setHasRedirected(true);
        navigate("/admin", { replace: true });
      }
    }
  }, [initialized, loading, isAuthenticated, user, navigate, hasRedirected]);

  const handleAuthSuccess = () => {
    console.log("Auth success - state change will handle redirect");
  };

  // Show loading while initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/20 to-muted/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center animate-pulse">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div className="text-lg text-muted-foreground">Checking your session...</div>
        </div>
      </div>
    );
  }

  // Don't render auth form if user is authenticated (prevents flash)
  if (isAuthenticated && user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <Header />
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-primary to-accent rounded-full">
              <Music className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Admin Access
          </h1>
          <p className="text-muted-foreground text-lg">
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
