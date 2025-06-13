
import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error("Error getting initial session:", error);
          }
          
          setSession(session);
          setUser(session?.user ?? null);
          setInitialized(true);
          setLoading(false);
          
          console.log("Auth initialized:", { user: session?.user?.email, hasSession: !!session });
        }
      } catch (error) {
        console.error("Unexpected error during auth initialization:", error);
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (mounted && initialized) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      }
    );

    initialize();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
      }
      return { error };
    } catch (error) {
      console.error("Unexpected sign out error:", error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    initialized,
    signOut,
    isAuthenticated: !!user && !!session,
  };
};
