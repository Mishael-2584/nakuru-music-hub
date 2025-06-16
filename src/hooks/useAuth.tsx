
import { useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastSessionRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const updateAuthState = (newSession: Session | null) => {
      if (!mounted) return;
      
      // Prevent duplicate updates for the same session
      const sessionId = newSession?.access_token || null;
      if (lastSessionRef.current === sessionId) {
        return;
      }
      
      lastSessionRef.current = sessionId;
      console.log("Auth state updating:", newSession?.user?.email, "Session ID:", sessionId?.substring(0, 10));
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
      if (!isInitialized) {
        setIsInitialized(true);
      }
    };

    // Get initial session first
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (mounted) {
          if (error) {
            console.error("Error getting session:", error);
          }
          console.log("Initial session retrieved:", session?.user?.email);
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

    // Set up auth state listener after getting initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth event:", event, session?.user?.email);
        // Only update if this is a meaningful change
        if (event !== 'INITIAL_SESSION') {
          updateAuthState(session);
        }
      }
    );

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isInitialized]);

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
