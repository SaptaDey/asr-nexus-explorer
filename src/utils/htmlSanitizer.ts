/**
 * HTML Sanitization Utilities
 * SECURITY: Provides secure HTML sanitization using DOMPurify
 * This module protects against XSS attacks in user-generated content
 */

import DOMPurify from 'dompurify';

/**
 * Configure DOMPurify with secure settings for research content
 */
const createSecureConfig = () => ({
  // Allowed tags for research content
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'div', 'span',
    'strong', 'b', 'em', 'i', 'u',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'a', 'img',
    'sub', 'sup'
  ],
  
  // Allowed attributes
  ALLOWED_ATTR: [
    'href', 'title', 'alt', 'src',
    'class', 'id',
    'target', 'rel'
  ],
  
  // Allowed URI schemes for links and images
  ALLOWED_URI_REGEXP: /^(?:(?:https?|ftp|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  
  // Additional security settings
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  
  // Remove unknown protocols and javascript: links
  SANITIZE_DOM: true,
  SANITIZE_NAMED_PROPS: true,
  
  // Keep safe elements
  KEEP_CONTENT: true,
  
  // Return DOM instead of HTML string for better performance
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM: false
});

/**
 * Sanitize HTML content for research display
 * SECURITY: Protects against XSS attacks in research content
 */
export const sanitizeResearchHTML = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  try {
    const config = createSecureConfig();
    const sanitized = DOMPurify.sanitize(html, config);
    
    // Additional validation - ensure no script content remains
    if (sanitized.includes('<script') || sanitized.includes('javascript:')) {
      console.warn('SECURITY: Potential XSS attempt blocked in research content');
      return 'Content blocked for security reasons';
    }
    
    return sanitized;
  } catch (error) {
    console.error('SECURITY: HTML sanitization failed:', error);
    return 'Content could not be safely displayed';
  }
};

/**
 * Sanitize HTML content with stricter rules for user input
 * SECURITY: Use for user-provided content that needs minimal formatting
 */
export const sanitizeUserHTML = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  try {
    const strictConfig = {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code'],
      ALLOWED_ATTR: ['class'],
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'a', 'img'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'href', 'src'],
      SANITIZE_DOM: true,
      KEEP_CONTENT: true
    };
    
    const sanitized = DOMPurify.sanitize(html, strictConfig);
    
    // Extra validation for user content
    if (sanitized.includes('<script') || sanitized.includes('javascript:') || sanitized.includes('data:')) {
      console.warn('SECURITY: XSS attempt blocked in user content');
      return 'Invalid content removed for security';
    }
    
    return sanitized;
  } catch (error) {
    console.error('SECURITY: User HTML sanitization failed:', error);
    return '';
  }
};

/**
 * Sanitize Plotly configuration objects
 * SECURITY: Prevents script injection through Plotly configs
 */
export const sanitizePlotlyConfig = (config: any): any => {
  if (!config || typeof config !== 'object') {
    return {};
  }
  
  try {
    // Convert to string and back to remove functions and script content
    const jsonString = JSON.stringify(config, (key, value) => {
      // Remove function values and suspicious content
      if (typeof value === 'function') {
        return undefined;
      }
      if (typeof value === 'string' && (
        value.includes('<script') || 
        value.includes('javascript:') || 
        value.includes('data:text/html') ||
        value.includes('eval(') ||
        value.includes('Function(')
      )) {
        console.warn('SECURITY: Suspicious content removed from Plotly config');
        return '[Content removed for security]';
      }
      return value;
    });
    
    const sanitizedConfig = JSON.parse(jsonString);
    
    // Remove potentially dangerous Plotly-specific properties
    if (sanitizedConfig.config) {
      delete sanitizedConfig.config.plotlyServerURL;
      delete sanitizedConfig.config.toImageButtonOptions?.format;
    }
    
    return sanitizedConfig;
  } catch (error) {
    console.error('SECURITY: Plotly config sanitization failed:', error);
    return { data: [], layout: { title: 'Configuration Error' } };
  }
};

/**
 * Create a secure React props object for dangerouslySetInnerHTML
 * SECURITY: Use this instead of raw dangerouslySetInnerHTML
 */
export const createSecureInnerHTML = (html: string, isUserContent = false) => {
  const sanitized = isUserContent ? sanitizeUserHTML(html) : sanitizeResearchHTML(html);
  return { __html: sanitized };
};

/**
 * Validate that a URL is safe for use in href or src attributes
 * SECURITY: Prevents javascript: and data: URL attacks
 */
export const isSafeURL = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const lowerUrl = url.toLowerCase().trim();
    
    // Block dangerous protocols
    const dangerousProtocols = [
      'javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'
    ];
    
    if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
      return false;
    }
    
    // Only allow http, https, and mailto
    if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://') || lowerUrl.startsWith('mailto:')) {
      return true;
    }
    
    // Allow relative URLs that don't start with protocols
    if (!lowerUrl.includes(':')) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('SECURITY: URL validation failed:', error);
    return false;
  }
};

// Log security module initialization
if (typeof window !== 'undefined') {
  console.info('✅ HTML Sanitization module loaded with DOMPurify');
}