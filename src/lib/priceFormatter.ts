/**
 * Format price with KSh prefix, thousand separator, and no decimals
 * @param price - The price amount
 * @returns Formatted price string (e.g., "KSh 15,000")
 */
export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return 'KSh 0';
  }
  
  // Round to nearest whole number and format with thousand separator
  return `KSh ${Math.round(numPrice).toLocaleString('en-KE')}`;
};

/**
 * Format price range
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @returns Formatted price range (e.g., "KSh 10,000 - KSh 50,000")
 */
export const formatPriceRange = (minPrice: number, maxPrice: number): string => {
  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
};

/**
 * Parse formatted price string back to number
 * @param priceString - Formatted price string
 * @returns Number value
 */
export const parsePrice = (priceString: string): number => {
  const cleaned = priceString.replace(/[^0-9]/g, '');
  return parseInt(cleaned) || 0;
};
