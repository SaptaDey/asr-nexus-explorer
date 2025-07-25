
/**
 * Secure Error Handler
 * Handles errors securely without exposing sensitive information
 */

export class SecureErrorHandler {
  private static instance: SecureErrorHandler;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SecureErrorHandler {
    if (!SecureErrorHandler.instance) {
      SecureErrorHandler.instance = new SecureErrorHandler();
    }
    return SecureErrorHandler.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    console.log('🔒 Secure error handler initialized');
  }

  createSecureError(message: string, originalError?: Error): Error {
    const secureError = new Error(message);
    
    // Remove sensitive information from stack trace
    if (secureError.stack) {
      secureError.stack = secureError.stack.replace(/sk-[a-zA-Z0-9]+/g, '[API_KEY_REDACTED]');
    }
    
    return secureError;
  }

  handleError(error: Error, context?: string): void {
    const secureError = this.createSecureError(error.message, error);
    
    if (context) {
      console.error(`[${context}] Error:`, secureError.message);
    } else {
      console.error('Error:', secureError.message);
    }
    
    // Log to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).errorReporting) {
      (window as any).errorReporting.captureException(secureError);
    }
  }
}

export const secureErrorHandler = SecureErrorHandler.getInstance();
