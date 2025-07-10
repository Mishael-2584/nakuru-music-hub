
import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  signOut: () => Promise<{ error: any }>;
  clearAllData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  // Memoized values to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => !!user, [user]);
  
  // Clear all cached data and storage
  const clearAllData = useCallback(() => {
    console.log('🧹 Clearing all cached data...');
    
    // Clear localStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear specific Supabase items
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.expires_at');
      localStorage.removeItem('supabase.auth.refresh_token');
      
      // Clear any other potential auth items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('session'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    // Clear state
    setSession(null);
    setUser(null);
    setLoading(false);
    setIsInitialized(true);
  }, []);

  // Optimized sign out function
  const signOut = useCallback(async () => {
    try {
      console.log('🔐 Starting sign out process...');
      
      // First try to refresh the session to ensure we have a valid token
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.getSession();
      
      if (refreshError) {
        console.error('Session refresh error:', refreshError);
      }
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Clear all cached data regardless of the result
      clearAllData();
      
      console.log('✅ Sign out completed');
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear all cached data even if there's an error
      clearAllData();
      return { error };
    }
  }, [clearAllData]);

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        // Check if session is expired
        if (initialSession && initialSession.expires_at) {
          const expiresAt = new Date(initialSession.expires_at * 1000);
          const now = new Date();
          
          if (expiresAt <= now) {
            // Session is expired, sign out and redirect to login
            console.log('Session expired, signing out user');
            await supabase.auth.signOut();
            if (mounted) {
              setSession(null);
              setUser(null);
              navigate('/auth?session_expired=true', { replace: true });
            }
            return;
          } else {
            if (mounted) {
              setSession(initialSession);
              setUser(initialSession?.user ?? null);
            }
          }
        } else {
          if (mounted) {
            setSession(initialSession);
            setUser(initialSession?.user ?? null);
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.email);
        
        // Handle session expiration
        if (event === 'TOKEN_REFRESHED' && session) {
          // Check if the refreshed session is still valid
          if (session.expires_at) {
            const expiresAt = new Date(session.expires_at * 1000);
            const now = new Date();
            
            if (expiresAt <= now) {
              console.log('Refreshed session is expired, signing out user');
              await supabase.auth.signOut();
              if (mounted) {
                setSession(null);
                setUser(null);
                navigate('/auth?session_expired=true', { replace: true });
              }
              return;
            }
          }
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          if (mounted) {
            setSession(null);
            setUser(null);
          }
        } else {
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
          }
        }
        
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    isAuthenticated,
    isInitialized,
    signOut,
    clearAllData
  }), [user, session, loading, isAuthenticated, isInitialized, signOut, clearAllData]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
