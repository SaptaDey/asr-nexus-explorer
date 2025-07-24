/**
 * Error Sanitization Utilities
 * Prevents API key exposure in error messages and logs
 */

export const sanitizeErrorMessage = (message: string): string => {
  return message
    // Gemini API keys
    .replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED_GEMINI_KEY]')
    // Perplexity API keys
    .replace(/pplx-[A-Za-z0-9_-]{40,}/g, '[REDACTED_PERPLEXITY_KEY]')
    // Bearer tokens
    .replace(/Bearer [A-Za-z0-9_.-]+/g, 'Bearer [REDACTED]')
    // Authorization headers
    .replace(/Authorization[^,}]+/g, 'Authorization: [REDACTED]')
    // x-goog-api-key headers
    .replace(/x-goog-api-key[^,}]+/g, 'x-goog-api-key: [REDACTED]')
    // Generic API key patterns
    .replace(/api[_-]?key['":\s]+[A-Za-z0-9_.-]{20,}/gi, 'api_key: [REDACTED]')
    // Access tokens
    .replace(/access[_-]?token['":\s]+[A-Za-z0-9_.-]{20,}/gi, 'access_token: [REDACTED]')
    // JWT tokens
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]');
};

export const sanitizeError = (error: Error | unknown): Error => {
  if (error instanceof Error) {
    const sanitizedMessage = sanitizeErrorMessage(error.message);
    const cleanError = new Error(sanitizedMessage);
    cleanError.name = error.name;
    cleanError.stack = error.stack ? sanitizeErrorMessage(error.stack) : undefined;
    return cleanError;
  }
  
  if (typeof error === 'string') {
    return new Error(sanitizeErrorMessage(error));
  }
  
  return new Error('Unknown error occurred');
};

export const secureConsoleError = (...args: any[]): void => {
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeErrorMessage(arg);
    }
    if (arg instanceof Error) {
      return sanitizeError(arg);
    }
    if (typeof arg === 'object' && arg !== null) {
      // Don't log objects that might contain credentials
      return '[Object - potentially sensitive data redacted]';
    }
    return arg;
  });
  
  console.error(...sanitizedArgs);
};

export const secureConsoleLog = (...args: any[]): void => {
  // Only log in development mode to prevent production exposure
  if (process.env.NODE_ENV === 'development') {
    const sanitizedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return sanitizeErrorMessage(arg);
      }
      if (typeof arg === 'object' && arg !== null) {
        // Sanitize object properties
        const sanitized = { ...arg };
        Object.keys(sanitized).forEach(key => {
          if (key.toLowerCase().includes('key') || 
              key.toLowerCase().includes('token') || 
              key.toLowerCase().includes('auth')) {
            sanitized[key] = '[REDACTED]';
          }
        });
        return sanitized;
      }
      return arg;
    });
    
    console.log(...sanitizedArgs);
  }
};

/**
 * Network request header sanitizer for debugging
 */
export const sanitizeRequestHeaders = (headers: Record<string, string>): Record<string, string> => {
  const sanitized = { ...headers };
  
  Object.keys(sanitized).forEach(key => {
    if (key.toLowerCase().includes('authorization') || 
        key.toLowerCase().includes('api-key') || 
        key.toLowerCase().includes('token')) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Network request body sanitizer
 */
export const sanitizeRequestBody = (body: any): any => {
  if (typeof body === 'string') {
    return sanitizeErrorMessage(body);
  }
  
  if (typeof body === 'object' && body !== null) {
    const sanitized = { ...body };
    Object.keys(sanitized).forEach(key => {
      if (key.toLowerCase().includes('key') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('auth') ||
          key.toLowerCase().includes('password')) {
        sanitized[key] = '[REDACTED]';
      }
    });
    return sanitized;
  }
  
  return body;
};