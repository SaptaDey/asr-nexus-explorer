/**
 * Secure Error Handler
 * CRITICAL SECURITY: Prevents research data leakage in error messages
 */

import { dataSanitizer } from './DataSanitizationService';

export interface SecureErrorConfig {
  enableDetailedErrors: boolean;
  logFullErrorsInDevelopment: boolean;
  redactStackTraces: boolean;
  redactErrorContext: boolean;
  maxErrorMessageLength: number;
}

export class SecureError extends Error {
  public readonly isSecure: boolean = true;
  public readonly sanitizedMessage: string;
  public readonly redactionCount: number;
  public readonly originalLength: number;

  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly context?: any
  ) {
    const sanitized = dataSanitizer.sanitizeForErrorReporting({ message, context, originalError });
    super(sanitized.sanitized.message || 'An error occurred');
    this.sanitizedMessage = sanitized.sanitized.message || 'An error occurred';
    this.redactionCount = sanitized.redactionCount;
    this.originalLength = message.length;
    this.name = 'SecureError';

    // Don't expose original stack trace in production
    if (process.env.NODE_ENV === 'production') {
      this.stack = undefined;
    }
  }
}

export class SecureErrorHandler {
  private static instance: SecureErrorHandler;
  private config: SecureErrorConfig;
  private isProduction: boolean;

  private constructor(config: SecureErrorConfig) {
    this.config = config;
    this.isProduction = process.env.NODE_ENV === 'production';
    this.initializeGlobalErrorHandling();
  }

  public static getInstance(config?: SecureErrorConfig): SecureErrorHandler {
    if (!SecureErrorHandler.instance) {
      const defaultConfig: SecureErrorConfig = {
        enableDetailedErrors: process.env.NODE_ENV !== 'production',
        logFullErrorsInDevelopment: true,
        redactStackTraces: true,
        redactErrorContext: true,
        maxErrorMessageLength: 200
      };
      SecureErrorHandler.instance = new SecureErrorHandler(config || defaultConfig);
    }
    return SecureErrorHandler.instance;
  }

  /**
   * Initialize global error handling
   */
  private initializeGlobalErrorHandling(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        const secureError = this.createSecureError(
          'Unhandled Promise Rejection',
          event.reason,
          { type: 'unhandledrejection' }
        );
        
        // Prevent the default browser behavior of logging the full error
        event.preventDefault();
        
        // Log safely
        if (!this.isProduction) {
          console.error('🔒 Secure Error Handler:', secureError.sanitizedMessage);
        }
      });

      // Handle general JavaScript errors
      window.addEventListener('error', (event) => {
        const secureError = this.createSecureError(
          event.message,
          event.error,
          {
            type: 'javascript',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        );

        // Prevent default behavior
        event.preventDefault();

        // Log safely
        if (!this.isProduction) {
          console.error('🔒 Secure Error Handler:', secureError.sanitizedMessage);
        }
      });
    }
  }

  /**
   * Create a secure error from any error input
   */
  public createSecureError(
    message: string,
    originalError?: any,
    context?: any
  ): SecureError {
    return new SecureError(message, originalError, context);
  }

  /**
   * Safely handle and log an error
   */
  public handleError(
    error: Error | any,
    context?: any,
    userFacingMessage?: string
  ): SecureError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
    const secureError = this.createSecureError(errorMessage, error, context);

    // In development, log more details (but still sanitized)
    if (!this.isProduction && this.config.logFullErrorsInDevelopment) {
      const sanitizedContext = dataSanitizer.sanitizeForErrorReporting({
        error: errorMessage,
        stack: error?.stack,
        context,
        userFacingMessage
      });
      
      console.error('🔒 Detailed Error Info:', sanitizedContext.sanitized);
    }

    return secureError;
  }

  /**
   * Create a user-safe error for display in UI
   */
  public createUserSafeError(
    error: Error | any,
    fallbackMessage: string = 'An unexpected error occurred'
  ): { message: string; code?: string; canRetry: boolean } {
    // Never expose internal error details to users
    const isNetworkError = error?.name === 'NetworkError' || 
                          error?.message?.includes('fetch') ||
                          error?.message?.includes('network');
    
    const isApiError = error?.status >= 400 && error?.status < 600;
    
    if (isNetworkError) {
      return {
        message: 'Network connection error. Please check your internet connection and try again.',
        code: 'NETWORK_ERROR',
        canRetry: true
      };
    }
    
    if (isApiError) {
      return {
        message: 'Service temporarily unavailable. Please try again in a moment.',
        code: 'API_ERROR',
        canRetry: true
      };
    }

    // Generic fallback
    return {
      message: fallbackMessage,
      code: 'GENERIC_ERROR',
      canRetry: false
    };
  }

  /**
   * Sanitize error for API responses
   */
  public sanitizeErrorForApi(error: Error | any): any {
    const sanitized = dataSanitizer.sanitizeForErrorReporting(error);
    
    return {
      error: sanitized.sanitized.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      redacted: sanitized.redactionCount > 0
    };
  }

  /**
   * Safe error reporting for analytics/monitoring
   */
  public createErrorReport(
    error: Error | any,
    context?: any
  ): any {
    const sanitized = dataSanitizer.sanitizeForErrorReporting({
      error: error?.message || 'Unknown error',
      name: error?.name || 'Error',
      stack: this.config.redactStackTraces ? '[REDACTED]' : error?.stack,
      context: this.config.redactErrorContext ? '[REDACTED]' : context
    });

    return {
      message: sanitized.sanitized.error,
      type: sanitized.sanitized.name,
      timestamp: new Date().toISOString(),
      environment: this.isProduction ? 'production' : 'development',
      redactionInfo: {
        count: sanitized.redactionCount,
        types: sanitized.redactionTypes,
        containsSensitive: sanitized.isSensitive
      },
      // Safe metadata only
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.pathname : 'Unknown'
      }
    };
  }

  /**
   * Wrap a function to catch and handle errors securely
   */
  public wrapFunction<T extends (...args: any[]) => any>(
    fn: T,
    context?: string
  ): (...args: Parameters<T>) => ReturnType<T> | SecureError {
    return (...args: Parameters<T>): ReturnType<T> | SecureError => {
      try {
        return fn(...args);
      } catch (error) {
        return this.handleError(error, { function: context, arguments: '[REDACTED]' });
      }
    };
  }

  /**
   * Wrap an async function to catch and handle errors securely
   */
  public wrapAsyncFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: string
  ): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | SecureError> {
    return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | SecureError> => {
      try {
        return await fn(...args);
      } catch (error) {
        return this.handleError(error, { function: context, arguments: '[REDACTED]' });
      }
    };
  }

  /**
   * Check if an error is already secure
   */
  public isSecureError(error: any): error is SecureError {
    return error instanceof SecureError || error?.isSecure === true;
  }

  /**
   * Get error handler configuration
   */
  public getConfig(): SecureErrorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<SecureErrorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const secureErrorHandler = SecureErrorHandler.getInstance();

// Utility functions
export function createSecureError(message: string, originalError?: any, context?: any): SecureError {
  return secureErrorHandler.createSecureError(message, originalError, context);
}

export function handleError(error: Error | any, context?: any): SecureError {
  return secureErrorHandler.handleError(error, context);
}

export function safeErrorForUser(error: Error | any, fallback?: string) {
  return secureErrorHandler.createUserSafeError(error, fallback);
}