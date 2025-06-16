
import { useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;

    const updateAuthState = (newSession: Session | null) => {
      if (!mounted) return;
      
      // Clear any pending auth updates
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }

      // Debounce auth state updates to prevent rapid changes
      authTimeoutRef.current = setTimeout(() => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);
          setIsInitialized(true);
        }
      }, 100);
    };

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (mounted) {
          if (error) {
            console.error("Error getting session:", error);
          }
          updateAuthState(session);
        }
      } catch (error) {
        console.error("Unexpected error getting session:", error);
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        updateAuthState(session);
      }
    );

    getInitialSession();

    return () => {
      mounted = false;
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
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
    }
  };

  return {
    user,
    session,
    loading,
    isInitialized,
    signOut,
    isAuthenticated: !!user && !!session,
  };
};
