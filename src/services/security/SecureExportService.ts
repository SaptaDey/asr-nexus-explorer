
/**
 * Secure Export Service
 * Handles secure data export with proper sanitization
 */

export interface ExportOptions {
  format: 'json' | 'csv' | 'xml';
  userConsent: boolean;
  includeMetadata: boolean;
  redactionLevel: 'none' | 'standard' | 'strict';
  purpose: string;
  recipientType: 'self' | 'support' | 'admin';
}

export class SecureExportService {
  private static instance: SecureExportService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SecureExportService {
    if (!SecureExportService.instance) {
      SecureExportService.instance = new SecureExportService();
    }
    return SecureExportService.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    console.log('🔒 Secure export service initialized');
  }

  async exportDebugInfo(data: any, options: ExportOptions): Promise<{
    success: boolean;
    exportId?: string;
    error?: string;
  }> {
    try {
      // Validate user consent
      if (!options.userConsent) {
        return {
          success: false,
          error: 'User consent required for data export'
        };
      }

      // Sanitize data based on redaction level
      const sanitizedData = this.sanitizeForExport(data, options.redactionLevel);

      // Generate export ID
      const exportId = this.generateExportId();

      // Log export activity
      console.log(`🔒 Data export requested: ${exportId}`, {
        purpose: options.purpose,
        recipient: options.recipientType,
        format: options.format,
        redactionLevel: options.redactionLevel
      });

      return {
        success: true,
        exportId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  private sanitizeForExport(data: any, redactionLevel: ExportOptions['redactionLevel']): any {
    if (redactionLevel === 'none') {
      return data;
    }

    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        let sanitized = obj;
        
        if (redactionLevel === 'standard' || redactionLevel === 'strict') {
          // Redact API keys
          sanitized = sanitized.replace(/sk-[a-zA-Z0-9]+/g, '[API_KEY_REDACTED]');
          
          // Redact email addresses
          sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
        }
        
        if (redactionLevel === 'strict') {
          // Additional strict redactions
          sanitized = sanitized.replace(/\b\d{4}\b/g, '[YEAR_REDACTED]');
        }
        
        return sanitized;
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const sanitized = Array.isArray(obj) ? [] : {};
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const sensitiveFields = ['password', 'apiKey', 'token', 'secret', 'key'];
            if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
              (sanitized as any)[key] = '[REDACTED]';
            } else {
              (sanitized as any)[key] = sanitize(obj[key]);
            }
          }
        }
        
        return sanitized;
      }
      
      return obj;
    };
    
    return sanitize(data);
  }

  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const secureExporter = SecureExportService.getInstance();
