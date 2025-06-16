
import { useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializationRef.current) return;
    initializationRef.current = true;

    let mounted = true;

    const updateAuthState = (newSession: Session | null, immediate = false) => {
      if (!mounted) return;
      
      // Clear any pending updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }

      const doUpdate = () => {
        if (!mounted) return;
        
        console.log("Auth state updating:", newSession?.user?.email || "No user");
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        setIsInitialized(true);
      };

      if (immediate) {
        doUpdate();
      } else {
        // Debounce updates to prevent rapid state changes
        updateTimeoutRef.current = setTimeout(doUpdate, 100);
      }
    };

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (mounted) {
          if (error) {
            console.error("Error getting session:", error);
            setLoading(false);
            setIsInitialized(true);
          } else {
            console.log("Initial session retrieved:", session?.user?.email || "No session");
            updateAuthState(session, true);
          }
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
        console.log("Auth event:", event, session?.user?.email || "No user");
        // Only update for meaningful changes, not initial session
        if (event !== 'INITIAL_SESSION' && mounted) {
          updateAuthState(session);
        }
      }
    );

    getInitialSession();

    return () => {
      mounted = false;
      initializationRef.current = false;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
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
