
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import AdminPanel from "@/components/AdminPanel";
import Footer from "@/components/Footer";
import { Music } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, isInitialized } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only check for redirect after auth is fully initialized and we haven't redirected yet
    if (isInitialized && !loading && !hasRedirected) {
      if (!isAuthenticated || !user) {
        console.log("No authenticated user, redirecting to auth");
        setHasRedirected(true);
        navigate("/auth", { replace: true });
      } else {
        console.log("User authenticated, staying on admin page");
      }
    }
  }, [user, loading, isAuthenticated, isInitialized, navigate, hasRedirected]);

  // Show loading while auth is initializing
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center animate-pulse">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div className="text-lg text-muted-foreground">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  // If not authenticated and we haven't redirected yet, show loading
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center animate-pulse">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div className="text-lg text-muted-foreground">Checking authentication...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <Header />
      <AdminPanel />
      <Footer />
    </div>
  );
};

export default Admin;
