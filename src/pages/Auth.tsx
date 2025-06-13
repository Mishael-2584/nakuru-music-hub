
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AuthForm from "@/components/auth/AuthForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { User } from "@supabase/supabase-js";
import { Music } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error("Error checking session:", error);
          }
          
          if (session?.user) {
            setUser(session.user);
            // Redirect to admin only if we have a valid session
            navigate("/admin", { replace: true });
          } else {
            setUser(null);
          }
          setCheckingSession(false);
          setLoading(false);
        }
      } catch (error) {
        console.error("Unexpected error checking session:", error);
        if (mounted) {
          setCheckingSession(false);
          setLoading(false);
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth page - Auth state changed:", event);
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            // Only navigate if we're not already checking session
            if (!checkingSession) {
              navigate("/admin", { replace: true });
            }
          } else {
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, checkingSession]);

  const handleAuthSuccess = () => {
    // Auth state change will handle the redirect
    console.log("Auth success - waiting for state change");
  };

  if (loading || checkingSession) {
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

  if (user) {
    return null; // Will redirect to admin
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
