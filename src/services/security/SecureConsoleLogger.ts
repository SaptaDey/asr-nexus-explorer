
/**
 * Secure Console Logger
 * Provides secure logging with data sanitization and redaction
 */

export class SecureConsoleLogger {
  private static instance: SecureConsoleLogger;
  private isInitialized = false;
  private originalConsole: typeof console;

  private constructor() {
    this.originalConsole = { ...console };
  }

  static getInstance(): SecureConsoleLogger {
    if (!SecureConsoleLogger.instance) {
      SecureConsoleLogger.instance = new SecureConsoleLogger();
    }
    return SecureConsoleLogger.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    console.log('🔒 Secure console logger initialized');
  }

  safeLog(...args: any[]): void {
    try {
      const sanitizedArgs = args.map(arg => this.sanitizeLogData(arg));
      this.originalConsole.log(...sanitizedArgs);
    } catch (error) {
      this.originalConsole.log('Logging error:', error);
    }
  }

  safeError(...args: any[]): void {
    try {
      const sanitizedArgs = args.map(arg => this.sanitizeLogData(arg));
      this.originalConsole.error(...sanitizedArgs);
    } catch (error) {
      this.originalConsole.error('Error logging error:', error);
    }
  }

  safeWarn(...args: any[]): void {
    try {
      const sanitizedArgs = args.map(arg => this.sanitizeLogData(arg));
      this.originalConsole.warn(...sanitizedArgs);
    } catch (error) {
      this.originalConsole.warn('Warning logging error:', error);
    }
  }

  private sanitizeLogData(data: any): any {
    if (typeof data === 'string') {
      return data.replace(/sk-[a-zA-Z0-9]+/g, '[API_KEY_REDACTED]');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      // Redact sensitive fields
      const sensitiveFields = ['password', 'apiKey', 'token', 'secret', 'key'];
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      });
      
      return sanitized;
    }
    
    return data;
  }

  emergencyDisable(): void {
    // Restore original console in emergency
    Object.assign(console, this.originalConsole);
  }
}

export const secureLogger = SecureConsoleLogger.getInstance();
