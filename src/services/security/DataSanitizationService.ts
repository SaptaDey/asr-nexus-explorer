
/**
 * Data Sanitization Service
 * Sanitizes data to prevent security vulnerabilities
 */

export class DataSanitizationService {
  private static instance: DataSanitizationService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DataSanitizationService {
    if (!DataSanitizationService.instance) {
      DataSanitizationService.instance = new DataSanitizationService();
    }
    return DataSanitizationService.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    console.log('🔒 Data sanitization service initialized');
  }

  sanitizeData(data: any): { sanitized: any; redactionCount: number } {
    let redactionCount = 0;
    
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        let sanitized = obj;
        
        // Redact API keys
        if (sanitized.includes('sk-')) {
          sanitized = sanitized.replace(/sk-[a-zA-Z0-9]+/g, '[API_KEY_REDACTED]');
          redactionCount++;
        }
        
        // Redact email addresses
        if (sanitized.includes('@')) {
          sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
          redactionCount++;
        }
        
        return sanitized;
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const sanitized = Array.isArray(obj) ? [] : {};
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            // Check for sensitive field names
            const sensitiveFields = ['password', 'apiKey', 'token', 'secret', 'key'];
            if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
              (sanitized as any)[key] = '[REDACTED]';
              redactionCount++;
            } else {
              (sanitized as any)[key] = sanitize(obj[key]);
            }
          }
        }
        
        return sanitized;
      }
      
      return obj;
    };
    
    return {
      sanitized: sanitize(data),
      redactionCount
    };
  }

  sanitizeHTML(html: string): string {
    // Basic HTML sanitization - remove potentially dangerous tags
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');
  }
}

export const dataSanitizer = DataSanitizationService.getInstance();
