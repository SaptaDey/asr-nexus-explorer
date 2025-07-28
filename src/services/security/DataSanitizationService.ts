/**
 * Data Sanitization Service
 * CRITICAL SECURITY: Prevents research data leakage in logs, exports, and debug info
 */

export interface SanitizationConfig {
  mode: 'development' | 'production' | 'strict';
  redactResearchContent: boolean;
  redactPersonalInfo: boolean;
  redactApiKeys: boolean;
  redactInternalPaths: boolean;
  preserveStructure: boolean;
  maxStringLength?: number;
}

export interface SanitizedData {
  sanitized: any;
  redactionCount: number;
  redactionTypes: string[];
  isSensitive: boolean;
}

export class DataSanitizationService {
  private static instance: DataSanitizationService;
  private config: SanitizationConfig;

  // Patterns for sensitive data detection
  private readonly SENSITIVE_PATTERNS = {
    // Research content patterns
    RESEARCH_CONTENT: [
      /\b(hypothes[ie]s?|conclusion|finding|result|data|analysis|evidence)\b.*[:.]/i,
      /\b(patient|subject|participant|sample)\b.*\d+/i,
      /\b(correlation|causation|significant|p-value|confidence)\b/i,
      /\b(research topic|study|investigation|experiment)\b/i
    ],
    
    // Personal information patterns
    PERSONAL_INFO: [
      /\b[A-Za-z0-9._%+-]+@[A-za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card
      /\b\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/ // Phone
    ],
    
    // API keys and secrets
    API_KEYS: [
      /\b(api[_-]?key|secret|token|credential|password)\b.*[=:]\s*['"`]?[A-Za-z0-9+/=]{8,}['"`]?/i,
      /\bAI[a-zA-Z0-9]{35,}/,
      /\bsk-[a-zA-Z0-9]{48}/,
      /\bBearer\s+[A-Za-z0-9+/=]{20,}/
    ],
    
    // File paths and system info
    INTERNAL_PATHS: [
      /\/home\/[^\/\s]+/g,
      /C:\\Users\\[^\\\/\s]+/g,
      /\b(localhost|127\.0\.0\.1|0\.0\.0\.0):\d+/g,
      /\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/g // UUIDs
    ]
  };

  // Redaction placeholders
  private readonly REDACTIONS = {
    RESEARCH_CONTENT: '[RESEARCH_DATA_REDACTED]',
    PERSONAL_INFO: '[PII_REDACTED]',
    API_KEYS: '[CREDENTIALS_REDACTED]',
    INTERNAL_PATHS: '[PATH_REDACTED]',
    LONG_STRING: '[CONTENT_TRUNCATED]',
    OBJECT_STRUCTURE: '[OBJECT_REDACTED]'
  };

  private constructor(config: SanitizationConfig) {
    this.config = config;
  }

  public static getInstance(config?: SanitizationConfig): DataSanitizationService {
    if (!DataSanitizationService.instance) {
      const defaultConfig: SanitizationConfig = {
        mode: import.meta.env.MODE === 'production' ? 'production' : 'development',
        redactResearchContent: true,
        redactPersonalInfo: true,
        redactApiKeys: true,
        redactInternalPaths: true,
        preserveStructure: true,
        maxStringLength: 200
      };
      DataSanitizationService.instance = new DataSanitizationService(config || defaultConfig);
    }
    return DataSanitizationService.instance;
  }

  /**
   * Sanitize any data structure for safe logging/export
   */
  public sanitizeData(data: any, customConfig?: Partial<SanitizationConfig>): SanitizedData {
    const config = { ...this.config, ...customConfig };
    const redactionTypes: Set<string> = new Set();
    let redactionCount = 0;
    let isSensitive = false;

    const sanitize = (obj: any, depth = 0): any => {
      // Prevent infinite recursion
      if (depth > 10) {
        redactionCount++;
        redactionTypes.add('DEEP_OBJECT');
        return '[MAX_DEPTH_REACHED]';
      }

      // Handle null/undefined
      if (obj === null || obj === undefined) {
        return obj;
      }

      // Handle strings
      if (typeof obj === 'string') {
        return this.sanitizeString(obj, config, redactionTypes, () => {
          redactionCount++;
          isSensitive = true;
        });
      }

      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item, depth + 1));
      }

      // Handle objects
      if (typeof obj === 'object') {
        const sanitized: any = {};
        
        for (const [key, value] of Object.entries(obj)) {
          // Check if key itself is sensitive
          const sanitizedKey = this.sanitizeString(key, config, redactionTypes, () => {
            redactionCount++;
            isSensitive = true;
          });
          
          // Special handling for known sensitive keys
          if (this.isSensitiveKey(key)) {
            sanitized[sanitizedKey] = this.REDACTIONS.API_KEYS;
            redactionCount++;
            redactionTypes.add('SENSITIVE_KEY');
            isSensitive = true;
          } else {
            sanitized[sanitizedKey] = sanitize(value, depth + 1);
          }
        }
        
        return sanitized;
      }

      // Handle functions (should not appear in JSON but just in case)
      if (typeof obj === 'function') {
        redactionCount++;
        redactionTypes.add('FUNCTION');
        return '[FUNCTION_REDACTED]';
      }

      // Return primitives as-is (numbers, booleans)
      return obj;
    };

    const sanitized = sanitize(data);

    return {
      sanitized,
      redactionCount,
      redactionTypes: Array.from(redactionTypes),
      isSensitive
    };
  }

  /**
   * Sanitize a string for safe logging
   */
  private sanitizeString(
    str: string, 
    config: SanitizationConfig,
    redactionTypes: Set<string>,
    onRedaction: () => void
  ): string {
    let result = str;

    // Truncate very long strings
    if (config.maxStringLength && str.length > config.maxStringLength) {
      result = str.substring(0, config.maxStringLength) + this.REDACTIONS.LONG_STRING;
      redactionTypes.add('LONG_STRING');
      onRedaction();
    }

    // Apply redaction based on config
    if (config.redactApiKeys) {
      for (const pattern of this.SENSITIVE_PATTERNS.API_KEYS) {
        if (pattern.test(result)) {
          result = result.replace(pattern, this.REDACTIONS.API_KEYS);
          redactionTypes.add('API_KEYS');
          onRedaction();
        }
      }
    }

    if (config.redactPersonalInfo) {
      for (const pattern of this.SENSITIVE_PATTERNS.PERSONAL_INFO) {
        if (pattern.test(result)) {
          result = result.replace(pattern, this.REDACTIONS.PERSONAL_INFO);
          redactionTypes.add('PERSONAL_INFO');
          onRedaction();
        }
      }
    }

    if (config.redactResearchContent) {
      for (const pattern of this.SENSITIVE_PATTERNS.RESEARCH_CONTENT) {
        if (pattern.test(result)) {
          result = this.REDACTIONS.RESEARCH_CONTENT;
          redactionTypes.add('RESEARCH_CONTENT');
          onRedaction();
          break; // Once we detect research content, redact the whole string
        }
      }
    }

    if (config.redactInternalPaths) {
      for (const pattern of this.SENSITIVE_PATTERNS.INTERNAL_PATHS) {
        result = result.replace(pattern, this.REDACTIONS.INTERNAL_PATHS);
        if (result !== str) {
          redactionTypes.add('INTERNAL_PATHS');
          onRedaction();
        }
      }
    }

    return result;
  }

  /**
   * Check if a key name itself is sensitive
   */
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'secret', 'token', 'key', 'credential', 'auth',
      'apikey', 'api_key', 'access_token', 'refresh_token',
      'private_key', 'public_key', 'session_id', 'user_id'
    ];
    
    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive)
    );
  }

  /**
   * Sanitize for console logging (strict mode)
   */
  public sanitizeForConsole(data: any): SanitizedData {
    return this.sanitizeData(data, {
      mode: 'production',
      redactResearchContent: true,
      redactPersonalInfo: true,
      redactApiKeys: true,
      redactInternalPaths: true,
      maxStringLength: 100
    });
  }

  /**
   * Sanitize for export (preserve more structure)
   */
  public sanitizeForExport(data: any, userConsent: boolean = false): SanitizedData {
    return this.sanitizeData(data, {
      mode: userConsent ? 'development' : 'production',
      redactResearchContent: !userConsent,
      redactPersonalInfo: true,
      redactApiKeys: true,
      redactInternalPaths: true,
      preserveStructure: true,
      maxStringLength: userConsent ? undefined : 500
    });
  }

  /**
   * Sanitize for error reporting
   */
  public sanitizeForErrorReporting(error: Error | any): SanitizedData {
    const errorData = {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Error',
      stack: error?.stack || '',
      ...error
    };

    return this.sanitizeData(errorData, {
      mode: 'strict',
      redactResearchContent: true,
      redactPersonalInfo: true,
      redactApiKeys: true,
      redactInternalPaths: true,
      maxStringLength: 200
    });
  }

  /**
   * Create a safe summary for debugging
   */
  public createSafeSummary(data: any): any {
    const sanitized = this.sanitizeData(data, {
      mode: 'production',
      redactResearchContent: true,
      redactPersonalInfo: true,
      redactApiKeys: true,
      redactInternalPaths: true,
      maxStringLength: 50
    });

    return {
      type: typeof data,
      isArray: Array.isArray(data),
      hasKeys: typeof data === 'object' && data !== null ? Object.keys(data).length : 0,
      sanitizedSample: sanitized.sanitized,
      redactionInfo: {
        count: sanitized.redactionCount,
        types: sanitized.redactionTypes,
        isSensitive: sanitized.isSensitive
      }
    };
  }

  /**
   * Check if data contains sensitive information
   */
  public containsSensitiveData(data: any): boolean {
    const result = this.sanitizeData(data);
    return result.isSensitive || result.redactionCount > 0;
  }
}

// Export singleton instance
export const dataSanitizer = DataSanitizationService.getInstance();