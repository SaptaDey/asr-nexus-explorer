/**
 * Secure Console Logger
 * CRITICAL SECURITY: Prevents research data leakage in production console logs
 */

import { DataSanitizationService, dataSanitizer } from './DataSanitizationService';

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface SecureLogConfig {
  enableInProduction: boolean;
  enableSanitization: boolean;
  logLevel: LogLevel;
  maxLogLength: number;
  redactSensitiveData: boolean;
}

export class SecureConsoleLogger {
  private static instance: SecureConsoleLogger;
  private config: SecureLogConfig;
  private originalConsole: Console;
  private isProduction: boolean;

  private constructor(config: SecureLogConfig) {
    this.config = config;
    this.originalConsole = { ...console };
    this.isProduction = import.meta.env.MODE === 'production';
    this.initializeSecureLogging();
  }

  public static getInstance(config?: SecureLogConfig): SecureConsoleLogger {
    if (!SecureConsoleLogger.instance) {
      const defaultConfig: SecureLogConfig = {
        enableInProduction: false, // CRITICAL: Disabled in production by default
        enableSanitization: true,
        logLevel: import.meta.env.MODE === 'production' ? 'error' : 'debug',
        maxLogLength: 500,
        redactSensitiveData: true
      };
      SecureConsoleLogger.instance = new SecureConsoleLogger(config || defaultConfig);
    }
    return SecureConsoleLogger.instance;
  }

  /**
   * Initialize secure logging by overriding console methods
   */
  private initializeSecureLogging(): void {
    // Override console methods in production
    if (this.isProduction && !this.config.enableInProduction) {
      // In production, completely disable most console methods
      console.log = this.createSecureLogger('log');
      console.info = this.createSecureLogger('info');
      console.warn = this.createSecureLogger('warn');
      console.debug = this.createSecureLogger('debug');
      // Keep error logging but sanitize it
      console.error = this.createSecureLogger('error');
    } else {
      // In development, sanitize all logs
      console.log = this.createSecureLogger('log');
      console.info = this.createSecureLogger('info');
      console.warn = this.createSecureLogger('warn');
      console.error = this.createSecureLogger('error');
      console.debug = this.createSecureLogger('debug');
    }
  }

  /**
   * Create a secure logger function that sanitizes data
   */
  private createSecureLogger(level: LogLevel): (...args: any[]) => void {
    const originalMethod = this.originalConsole[level] || this.originalConsole.log;

    return (...args: any[]) => {
      // In production, only allow error logs
      if (this.isProduction && !this.config.enableInProduction && level !== 'error') {
        return;
      }

      // Check log level hierarchy
      if (!this.shouldLog(level)) {
        return;
      }

      try {
        const sanitizedArgs = args.map(arg => this.sanitizeLogArgument(arg));
        
        // Add security context in development
        if (!this.isProduction && this.config.enableSanitization) {
          const hasRedacted = sanitizedArgs.some(arg => 
            typeof arg === 'string' && arg.includes('REDACTED')
          );
          
          if (hasRedacted) {
            originalMethod.call(console, '🔒 [SANITIZED]', ...sanitizedArgs);
            return;
          }
        }

        originalMethod.call(console, ...sanitizedArgs);
      } catch (error) {
        // Fallback: if sanitization fails, don't log anything sensitive
        if (this.isProduction) {
          originalMethod.call(console, `[SANITIZATION_ERROR] Failed to log ${level} message`);
        } else {
          originalMethod.call(console, '[SANITIZATION_ERROR]', error);
        }
      }
    };
  }

  /**
   * Sanitize a single log argument
   */
  private sanitizeLogArgument(arg: any): any {
    if (!this.config.enableSanitization) {
      return arg;
    }

    // Handle different types of arguments
    if (arg === null || arg === undefined) {
      return arg;
    }

    if (typeof arg === 'string') {
      return this.sanitizeString(arg);
    }

    if (typeof arg === 'object') {
      // Use data sanitizer for objects
      const sanitized = dataSanitizer.sanitizeForConsole(arg);
      
      // If too much was redacted, just show a summary
      if (sanitized.redactionCount > 5) {
        return `[OBJECT_SUMMARY: ${Object.keys(arg).length} keys, ${sanitized.redactionCount} redactions]`;
      }
      
      return sanitized.sanitized;
    }

    // Return primitives as-is
    if (typeof arg === 'number' || typeof arg === 'boolean') {
      return arg;
    }

    // Handle functions
    if (typeof arg === 'function') {
      return '[Function]';
    }

    return '[Unknown Type]';
  }

  /**
   * Sanitize string arguments
   */
  private sanitizeString(str: string): string {
    if (!this.config.redactSensitiveData) {
      return str;
    }

    // Truncate very long strings
    if (str.length > this.config.maxLogLength) {
      str = str.substring(0, this.config.maxLogLength) + '[TRUNCATED]';
    }

    // Use sanitizer for comprehensive cleaning
    const sanitized = dataSanitizer.sanitizeData(str);
    return sanitized.sanitized;
  }

  /**
   * Check if we should log based on level hierarchy
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'log', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.config.logLevel);
    const messageIndex = levels.indexOf(level);
    
    return messageIndex >= currentIndex;
  }

  /**
   * Safe logging methods that can be used throughout the application
   */
  public safeLog(message: string, ...args: any[]): void {
    this.secureLog('log', message, ...args);
  }

  public safeInfo(message: string, ...args: any[]): void {
    this.secureLog('info', message, ...args);
  }

  public safeWarn(message: string, ...args: any[]): void {
    this.secureLog('warn', message, ...args);
  }

  public safeError(message: string, error?: any, ...args: any[]): void {
    this.secureLog('error', message, error, ...args);
  }

  public safeDebug(message: string, ...args: any[]): void {
    this.secureLog('debug', message, ...args);
  }

  /**
   * Internal secure logging with explicit sanitization
   */
  private secureLog(level: LogLevel, message: string, ...args: any[]): void {
    if (this.isProduction && !this.config.enableInProduction && level !== 'error') {
      return;
    }

    try {
      const sanitizedMessage = this.sanitizeString(message);
      const sanitizedArgs = args.map(arg => this.sanitizeLogArgument(arg));
      
      const originalMethod = this.originalConsole[level] || this.originalConsole.log;
      originalMethod.call(console, `🔒 ${sanitizedMessage}`, ...sanitizedArgs);
    } catch (error) {
      // Silent fail in production
      if (!this.isProduction) {
        this.originalConsole.error('SecureLogger error:', error);
      }
    }
  }

  /**
   * Create a research-safe summary for debugging
   */
  public logResearchSafeSummary(data: any, label: string = 'Data'): void {
    const summary = dataSanitizer.createSafeSummary(data);
    this.safeDebug(`${label} Summary:`, summary);
  }

  /**
   * Restore original console (for testing or emergency)
   */
  public restoreOriginalConsole(): void {
    Object.assign(console, this.originalConsole);
  }

  /**
   * Get sanitization statistics
   */
  public getSanitizationStats(): any {
    return {
      isProduction: this.isProduction,
      config: this.config,
      sanitizationEnabled: this.config.enableSanitization
    };
  }

  /**
   * Emergency disable (for critical debugging)
   */
  public emergencyDisable(): void {
    console.warn('🚨 SecureLogger: Emergency disable activated');
    this.restoreOriginalConsole();
  }
}

// Initialize secure logging automatically
export const secureLogger = SecureConsoleLogger.getInstance();

// Export convenient methods
export const safeLog = secureLogger.safeLog.bind(secureLogger);
export const safeInfo = secureLogger.safeInfo.bind(secureLogger);
export const safeWarn = secureLogger.safeWarn.bind(secureLogger);
export const safeError = secureLogger.safeError.bind(secureLogger);
export const safeDebug = secureLogger.safeDebug.bind(secureLogger);