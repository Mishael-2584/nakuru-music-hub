
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AuthForm from "@/components/auth/AuthForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { User } from "@supabase/supabase-js";

const Auth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        navigate("/admin");
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          navigate("/admin");
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuthSuccess = () => {
    navigate("/admin");
  };

  if (user) {
    return null; // Will redirect to admin
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 to-muted/50">
      <Header />
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Admin Access</h1>
          <p className="text-muted-foreground">
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
