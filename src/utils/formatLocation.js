/**
 * Format location data for display
 * Handles both string and object formats
 * @param {string|object} location - Location data
 * @returns {string} Formatted location string
 */
export const formatLocation = (location) => {
  if (!location) return 'Location not specified';
  
  if (typeof location === 'string') {
    return location;
  }
  
  if (typeof location === 'object') {
    // Handle various location object formats
    const parts = [];
    
    // Check for city
    if (location.city) parts.push(location.city);
    if (location.location_city) parts.push(location.location_city);
    
    // Check for state
    if (location.state) parts.push(location.state);
    if (location.location_state) parts.push(location.location_state);
    
    // Check for address
    if (location.address) parts.push(location.address);
    if (location.street) parts.push(location.street);
    
    // Check for country
    if (location.country && location.country !== 'Pakistan') {
      parts.push(location.country);
    }
    
    const formatted = parts.filter(Boolean).join(', ');
    return formatted || 'Location not specified';
  }
  
  return 'Location not specified';
};

 // Format prices
 export const formatPrice = (price) => {
  // If already formatted (contains $ or PKR), return as is
  if (typeof price === 'string' && (price.includes('$') || price.includes('PKR') || price.includes('Rs'))) {
    return price;
  }
  
  // If it's a string but not formatted, try to parse it
  if (typeof price === 'string') {
    // Remove any commas or spaces
    const cleaned = price.replace(/[,\s]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) {
      return 'N/A';
    }
    return formatNumericPrice(num);
  }
  
  // If it's a number, format it
  if (typeof price === 'number') {
    return formatNumericPrice(price);
  }
  
  return 'N/A';
};

// Helper function to format numeric prices
const formatNumericPrice = (num) => {
  if (isNaN(num)) return 'N/A';
  
  // Format in PKR (Pakistani Rupees) instead of USD
  if (num >= 1000000000) {
    return `PKR ${(num / 1000000000).toFixed(1)}B`;
  } else if (num >= 10000000) {
    return `PKR ${(num / 10000000).toFixed(1)}Cr`;
  } else if (num >= 100000) {
    return `PKR ${(num / 100000).toFixed(1)}L`;
  } else if (num >= 1000) {
    return `PKR ${(num / 1000).toFixed(0)}K`;
  }
  return `PKR ${num.toLocaleString()}`;
};


/**
 * Format currency for display
 * Handles both string and number formats
 * @param {string|number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (typeof amount === 'string') {
    return amount; // Already formatted by backend
  }
  
  if (typeof amount === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  }
  
  return '$0';
};

/**
 * Format percentage for display
 * Handles both string and number formats
 * @param {string|number} percentage - Percentage to format
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (percentage) => {
  if (typeof percentage === 'string') {
    return percentage;
  }
  
  if (typeof percentage === 'number') {
    return `${percentage.toFixed(2)}%`;
  }
  
  return '0.00%';
};

/**
 * Get the first available image from property data
 * Handles various image formats from different API responses
 * Uses images from database as-is (full URLs or relative paths)
 * @param {object} property - Property object
 * @returns {string|null} Image URL or null
 */
export const getPropertyImage = (property) => {
  if (!property) return null;
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hmr-backend.vercel.app';
  
  // Helper to ensure full URL
  const ensureFullUrl = (url) => {
    if (!url) return null;
    // If already a full URL (starts with http:// or https://), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If starts with /, it's a relative path - prepend API base URL
    if (url.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }
    // Otherwise, assume it's a relative path and prepend API base URL with /
    return `${API_BASE_URL}/${url}`;
  };
  
  // Direct image property (from database)
  if (property.image) {
    return ensureFullUrl(property.image);
  }
  
  // Images object with thumbnail
  if (property.images?.thumbnail) {
    return ensureFullUrl(property.images.thumbnail);
  }
  
  // Images object with gallery array
  if (property.images?.gallery && Array.isArray(property.images.gallery) && property.images.gallery.length > 0) {
    return ensureFullUrl(property.images.gallery[0]);
  }
  
  // Direct images array
  if (property.images && Array.isArray(property.images) && property.images.length > 0) {
    return ensureFullUrl(property.images[0]);
  }
  
  // Check for image_url field (common in databases)
  if (property.image_url) {
    return ensureFullUrl(property.image_url);
  }
  
  // Check for primary_image field
  if (property.primary_image) {
    return ensureFullUrl(property.primary_image);
  }
  
  return null;
};

/**
 * Get all available images from property data
 * Uses images from database as-is (full URLs or relative paths)
 * @param {object} property - Property object
 * @returns {array} Array of image URLs
 */
export const getPropertyImages = (property) => {
  if (!property) return [];
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hmr-backend.vercel.app';
  
  // Helper to ensure full URL
  const ensureFullUrl = (url) => {
    if (!url) return null;
    // If already a full URL (starts with http:// or https://), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If starts with /, it's a relative path - prepend API base URL
    if (url.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }
    // Otherwise, assume it's a relative path and prepend API base URL with /
    return `${API_BASE_URL}/${url}`;
  };
  
  // Images object with gallery array
  if (property.images?.gallery && Array.isArray(property.images.gallery)) {
    return property.images.gallery.map(img => ensureFullUrl(img)).filter(Boolean);
  }
  
  // Direct images array
  if (property.images && Array.isArray(property.images)) {
    return property.images.map(img => ensureFullUrl(img)).filter(Boolean);
  }
  
  // Single image
  const singleImage = getPropertyImage(property);
  return singleImage ? [singleImage] : [];
};
