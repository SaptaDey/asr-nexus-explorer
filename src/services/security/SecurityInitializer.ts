/**
 * Security Initializer
 * CRITICAL SECURITY: Initializes all security services to prevent data leakage
 */

import { secureLogger } from './SecureConsoleLogger';
import { secureErrorHandler } from './SecureErrorHandler';
import { dataSanitizer } from './DataSanitizationService';
import { secureExporter } from './SecureExportService';

export interface SecurityConfig {
  enableConsoleLogging: boolean;
  enableErrorHandling: boolean;
  enableDataSanitization: boolean;
  enableSecureExports: boolean;
  productionMode: boolean;
}

export class SecurityInitializer {
  private static instance: SecurityInitializer;
  private initialized: boolean = false;
  private config: SecurityConfig;

  private constructor() {
    this.config = {
      enableConsoleLogging: true,
      enableErrorHandling: true,
      enableDataSanitization: true,
      enableSecureExports: true,
      productionMode: process.env.NODE_ENV === 'production'
    };
  }

  public static getInstance(): SecurityInitializer {
    if (!SecurityInitializer.instance) {
      SecurityInitializer.instance = new SecurityInitializer();
    }
    return SecurityInitializer.instance;
  }

  /**
   * Initialize all security services
   */
  public async initialize(customConfig?: Partial<SecurityConfig>): Promise<void> {
    if (this.initialized) {
      console.warn('🔒 Security services already initialized');
      return;
    }

    this.config = { ...this.config, ...customConfig };

    try {
      // Initialize secure console logging
      if (this.config.enableConsoleLogging) {
        secureLogger; // Trigger initialization
        console.log('🔒 Secure console logging initialized');
      }

      // Initialize secure error handling
      if (this.config.enableErrorHandling) {
        secureErrorHandler; // Trigger initialization
        console.log('🔒 Secure error handling initialized');
      }

      // Initialize data sanitization
      if (this.config.enableDataSanitization) {
        dataSanitizer; // Trigger initialization
        console.log('🔒 Data sanitization service initialized');
      }

      // Initialize secure exports
      if (this.config.enableSecureExports) {
        secureExporter; // Trigger initialization
        console.log('🔒 Secure export service initialized');
      }

      this.initialized = true;

      // Log final initialization status
      console.log('🛡️ All security services initialized successfully');
      
      if (this.config.productionMode) {
        console.log('🔒 Production mode: Enhanced security measures active');
      } else {
        console.log('🔍 Development mode: Security services with debugging enabled');
      }

    } catch (error) {
      console.error('❌ Security initialization failed:', error);
      throw new Error('Critical security initialization failure');
    }
  }

  /**
   * Get initialization status
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current configuration
   */
  public getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Validate security services are working
   */
  public async validateSecurity(): Promise<{ 
    success: boolean; 
    services: Record<string, boolean>;
    errors: string[] 
  }> {
    const results = {
      success: true,
      services: {} as Record<string, boolean>,
      errors: [] as string[]
    };

    try {
      // Test console logging
      if (this.config.enableConsoleLogging) {
        try {
          secureLogger.safeLog('Security validation test');
          results.services.consoleLogging = true;
        } catch (error) {
          results.services.consoleLogging = false;
          results.errors.push('Console logging validation failed');
          results.success = false;
        }
      }

      // Test error handling
      if (this.config.enableErrorHandling) {
        try {
          secureErrorHandler.createSecureError('Test error');
          results.services.errorHandling = true;
        } catch (error) {
          results.services.errorHandling = false;
          results.errors.push('Error handling validation failed');
          results.success = false;
        }
      }

      // Test data sanitization
      if (this.config.enableDataSanitization) {
        try {
          const testData = { sensitive: 'test data', apiKey: 'sk-test123' };
          const sanitized = dataSanitizer.sanitizeData(testData);
          results.services.dataSanitization = sanitized.redactionCount > 0;
        } catch (error) {
          results.services.dataSanitization = false;
          results.errors.push('Data sanitization validation failed');
          results.success = false;
        }
      }

      // Test secure exports
      if (this.config.enableSecureExports) {
        try {
          const testExport = await secureExporter.exportDebugInfo(
            { test: 'data' },
            {
              format: 'json',
              userConsent: false,
              includeMetadata: false,
              redactionLevel: 'standard',
              purpose: 'validation test',
              recipientType: 'self'
            }
          );
          results.services.secureExports = testExport.success;
        } catch (error) {
          results.services.secureExports = false;
          results.errors.push('Secure exports validation failed');
          results.success = false;
        }
      }

    } catch (error) {
      results.success = false;
      results.errors.push(`Validation error: ${error}`);
    }

    return results;
  }

  /**
   * Emergency shutdown of security services
   */
  public emergencyShutdown(): void {
    console.warn('🚨 SECURITY: Emergency shutdown initiated');
    
    try {
      // Restore original console in case of emergency
      secureLogger.emergencyDisable();
      console.warn('🚨 Console logging disabled');
    } catch (error) {
      console.error('Failed to shutdown console logging');
    }

    this.initialized = false;
    console.warn('🚨 Security services emergency shutdown complete');
  }

  /**
   * Get security status report
   */
  public getSecurityStatus(): any {
    return {
      initialized: this.initialized,
      config: this.config,
      timestamp: new Date().toISOString(),
      services: {
        consoleLogging: this.config.enableConsoleLogging,
        errorHandling: this.config.enableErrorHandling,
        dataSanitization: this.config.enableDataSanitization,
        secureExports: this.config.enableSecureExports
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        productionMode: this.config.productionMode,
        userAgent: typeof navigator !== 'undefined' ? '[REDACTED]' : 'Server',
        url: typeof window !== 'undefined' ? '[REDACTED]' : 'Server'
      }
    };
  }
}

// Create and export singleton
export const securityInitializer = SecurityInitializer.getInstance();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  securityInitializer.initialize().catch(error => {
    console.error('🚨 Critical: Security auto-initialization failed:', error);
  });
}