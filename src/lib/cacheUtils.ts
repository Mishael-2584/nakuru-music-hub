// Cache and performance utilities

/**
 * Clears all browser cache and storage related to authentication
 */
export const clearAuthCache = () => {
  console.log('🧹 Clearing authentication cache...');
  
  try {
    // Clear localStorage
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
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('✅ Cache cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
};

/**
 * Forces a hard refresh of the page
 */
export const forceRefresh = () => {
  console.log('🔄 Forcing page refresh...');
  window.location.reload();
};

/**
 * Clears cache and redirects to auth page
 */
export const clearAndRedirect = (navigate: any, toast: any) => {
  clearAuthCache();
  navigate("/auth");
  toast({
    title: "Cache Cleared",
    description: "All cached data has been cleared. Please sign in again.",
  });
};

/**
 * Debounce function to prevent excessive API calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function to limit function calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}; 