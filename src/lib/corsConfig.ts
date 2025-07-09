// CORS Configuration for image loading
export const CORS_CONFIG = {
  // List of allowed domains for image loading
  allowedDomains: [
    'localhost',
    '127.0.0.1',
    'damonmusicacademy.co.ke',
    'xtjarscgxhbyktwriahu.supabase.co', // Supabase storage
    'supabase.co',
    'supabase.com'
  ],
  
  // Check if a URL is from an allowed domain
  isAllowedDomain: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return CORS_CONFIG.allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  },
  
  // Get CORS settings for an image
  getCorsSettings: (url: string): string => {
    return CORS_CONFIG.isAllowedDomain(url) ? 'anonymous' : 'anonymous';
  }
};

// Helper function to create an image with proper CORS settings
export const createImageWithCORS = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = CORS_CONFIG.getCorsSettings(src);
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    
    img.src = src;
  });
}; 