/**
 * Secure Network Request Utilities
 * Prevents API key exposure in browser dev tools network tab
 */

import { sanitizeRequestHeaders, sanitizeRequestBody, secureConsoleError } from './errorSanitizer';

export interface SecureRequestOptions extends RequestInit {
  url: string;
  secureHeaders?: Record<string, string>;
  logRequest?: boolean;
}

/**
 * Make a secure fetch request that prevents API key exposure in browser dev tools
 */
export const secureNetworkRequest = async (options: SecureRequestOptions): Promise<Response> => {
  const { url, secureHeaders = {}, logRequest = false, ...fetchOptions } = options;
  
  // Merge secure headers with existing headers
  const headers = {
    ...fetchOptions.headers,
    ...secureHeaders
  };
  
  // Log sanitized request details only in development
  if (logRequest && process.env.NODE_ENV === 'development') {
    console.log('🌐 Making secure network request:', {
      url: url.replace(/\/v[0-9]+\/models\/.*/, '/v*/models/[MODEL]'),
      method: fetchOptions.method || 'GET',
      headers: sanitizeRequestHeaders(headers as Record<string, string>),
      bodySize: fetchOptions.body ? (typeof fetchOptions.body === 'string' ? fetchOptions.body.length : '[Binary Data]') : 0
    });
  }
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers
    });
    
    // Log response status without sensitive details
    if (logRequest && process.env.NODE_ENV === 'development') {
      console.log('✅ Network request completed:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      });
    }
    
    return response;
  } catch (error) {
    secureConsoleError('❌ Network request failed:', error);
    throw error;
  }
};

/**
 * Create secure headers for Gemini API
 */
export const createGeminiHeaders = (apiKey: string): Record<string, string> => {
  return {
    'x-goog-api-key': apiKey,
    'Content-Type': 'application/json'
  };
};

/**
 * Create secure headers for Perplexity API
 */
export const createPerplexityHeaders = (apiKey: string): Record<string, string> => {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

/**
 * Create secure headers for authenticated requests
 */
export const createAuthHeaders = (token: string): Record<string, string> => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Validate API key format before making requests
 */
export const validateApiKeyFormat = (apiKey: string, provider: 'gemini' | 'perplexity'): boolean => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  switch (provider) {
    case 'gemini':
      return apiKey.startsWith('AIza') && apiKey.length >= 39;
    case 'perplexity':
      return apiKey.startsWith('pplx-') && apiKey.length >= 45;
    default:
      return false;
  }
};

/**
 * Network request interceptor for debugging (removes sensitive headers)
 */
export const createNetworkDebugger = () => {
  if (process.env.NODE_ENV === 'development') {
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Only log non-sensitive requests
      if (!url.includes('generativelanguage.googleapis.com') && 
          !url.includes('api.perplexity.ai')) {
        console.log('🌐 Network request:', {
          url: url.length > 100 ? url.substring(0, 100) + '...' : url,
          method: init?.method || 'GET'
        });
      }
      
      return originalFetch(input, init);
    };
  }
};

/**
 * Clean up network debug interceptor
 */
export const removeNetworkDebugger = () => {
  if (process.env.NODE_ENV === 'development' && (window as any).originalFetch) {
    window.fetch = (window as any).originalFetch;
    delete (window as any).originalFetch;
  }
};

/**
 * Request timeout wrapper with secure error handling
 */
export const secureRequestWithTimeout = async (
  request: Promise<Response>, 
  timeoutMs: number = 30000
): Promise<Response> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout - no sensitive data exposed')), timeoutMs);
  });
  
  try {
    return await Promise.race([request, timeoutPromise]);
  } catch (error) {
    secureConsoleError('Request failed with timeout:', error);
    throw error;
  }
};