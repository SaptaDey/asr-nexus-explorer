/**
 * Secure Export Service
 * CRITICAL SECURITY: Prevents research data leakage in exports and debug dumps
 */

import { dataSanitizer } from './DataSanitizationService';
import { secureErrorHandler } from './SecureErrorHandler';

export interface ExportSecurity {
  requireExplicitConsent: boolean;
  redactSensitiveFields: boolean;
  limitExportSize: boolean;
  maxExportSizeMB: number;
  encryptExports: boolean;
  watermarkExports: boolean;
  logExportActivity: boolean;
}

export interface SecureExportOptions {
  format: 'json' | 'csv' | 'txt' | 'pdf';
  userConsent: boolean;
  includeMetadata: boolean;
  includeSensitiveData: boolean;
  redactionLevel: 'minimal' | 'standard' | 'aggressive';
  purpose: string;
  recipientType: 'self' | 'collaborator' | 'public' | 'support';
}

export interface ExportAuditLog {
  timestamp: string;
  sessionId: string;
  userId?: string;
  dataTypes: string[];
  format: string;
  sizeBytes: number;
  redactionCount: number;
  purpose: string;
  recipientType: string;
  ipAddress?: string;
  userAgent?: string;
}

export class SecureExportService {
  private static instance: SecureExportService;
  private config: ExportSecurity;
  private auditLogs: ExportAuditLog[] = [];

  private constructor(config: ExportSecurity) {
    this.config = config;
  }

  public static getInstance(config?: ExportSecurity): SecureExportService {
    if (!SecureExportService.instance) {
      const defaultConfig: ExportSecurity = {
        requireExplicitConsent: true,
        redactSensitiveFields: true,
        limitExportSize: true,
        maxExportSizeMB: 10,
        encryptExports: false, // Encryption planned for future release
        watermarkExports: true,
        logExportActivity: true
      };
      SecureExportService.instance = new SecureExportService(config || defaultConfig);
    }
    return SecureExportService.instance;
  }

  /**
   * Securely export research session data
   */
  public async exportSessionData(
    sessionId: string,
    data: any,
    options: SecureExportOptions
  ): Promise<{ success: boolean; data?: string; error?: string; auditId?: string }> {
    try {
      // Validate export request
      const validation = this.validateExportRequest(sessionId, data, options);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Apply security policies
      const securedData = await this.applySecurityPolicies(data, options);
      
      // Check size limits
      const dataSize = this.calculateDataSize(securedData.sanitized);
      if (this.config.limitExportSize && dataSize > this.config.maxExportSizeMB * 1024 * 1024) {
        return { 
          success: false, 
          error: `Export too large (${Math.round(dataSize / 1024 / 1024)}MB). Maximum allowed: ${this.config.maxExportSizeMB}MB` 
        };
      }

      // Format the data
      const formattedData = await this.formatExportData(securedData.sanitized, options);
      
      // Add watermark if enabled
      const finalData = this.config.watermarkExports 
        ? this.addSecurityWatermark(formattedData, options)
        : formattedData;

      // Log export activity
      const auditId = this.config.logExportActivity 
        ? this.logExportActivity(sessionId, data, options, securedData.redactionCount, dataSize)
        : undefined;

      return {
        success: true,
        data: finalData,
        auditId
      };

    } catch (error) {
      const secureError = secureErrorHandler.handleError(error, { 
        operation: 'exportSessionData', 
        sessionId 
      });
      
      return { 
        success: false, 
        error: secureError.sanitizedMessage 
      };
    }
  }

  /**
   * Securely export debug information
   */
  public async exportDebugInfo(
    debugData: any,
    options: Omit<SecureExportOptions, 'includeSensitiveData'>
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      // Debug exports should never include sensitive data
      const secureOptions: SecureExportOptions = {
        ...options,
        includeSensitiveData: false,
        redactionLevel: 'aggressive'
      };

      // Create debug-safe summary
      const debugSummary = this.createDebugSafeSummary(debugData);
      
      return await this.exportSessionData('debug-export', debugSummary, secureOptions);
    } catch (error) {
      const secureError = secureErrorHandler.handleError(error, { operation: 'exportDebugInfo' });
      return { success: false, error: secureError.sanitizedMessage };
    }
  }

  /**
   * Validate export request
   */
  private validateExportRequest(
    sessionId: string,
    data: any,
    options: SecureExportOptions
  ): { valid: boolean; error?: string } {
    // Check consent requirements
    if (this.config.requireExplicitConsent && !options.userConsent) {
      return { valid: false, error: 'Explicit user consent required for data export' };
    }

    // Validate session ID
    if (!sessionId || typeof sessionId !== 'string') {
      return { valid: false, error: 'Valid session ID required' };
    }

    // Check if data exists
    if (!data) {
      return { valid: false, error: 'No data provided for export' };
    }

    // Validate export purpose
    if (!options.purpose || options.purpose.trim().length === 0) {
      return { valid: false, error: 'Export purpose must be specified' };
    }

    return { valid: true };
  }

  /**
   * Apply security policies to data before export
   */
  private async applySecurityPolicies(
    data: any,
    options: SecureExportOptions
  ): Promise<{ sanitized: any; redactionCount: number; redactionTypes: string[] }> {
    const redactionConfig = this.getRedactionConfig(options.redactionLevel);
    
    // Apply sanitization based on options
    if (options.includeSensitiveData && options.userConsent) {
      // User has explicitly consented to include sensitive data
      return dataSanitizer.sanitizeForExport(data, true);
    } else {
      // Standard secure export
      return dataSanitizer.sanitizeForExport(data, false);
    }
  }

  /**
   * Get redaction configuration based on level
   */
  private getRedactionConfig(level: 'minimal' | 'standard' | 'aggressive') {
    switch (level) {
      case 'minimal':
        return {
          redactResearchContent: false,
          redactPersonalInfo: true,
          redactApiKeys: true,
          redactInternalPaths: true,
          maxStringLength: 1000
        };
      case 'standard':
        return {
          redactResearchContent: true,
          redactPersonalInfo: true,
          redactApiKeys: true,
          redactInternalPaths: true,
          maxStringLength: 500
        };
      case 'aggressive':
        return {
          redactResearchContent: true,
          redactPersonalInfo: true,
          redactApiKeys: true,
          redactInternalPaths: true,
          maxStringLength: 200
        };
    }
  }

  /**
   * Format export data based on requested format
   */
  private async formatExportData(data: any, options: SecureExportOptions): Promise<string> {
    switch (options.format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return this.convertToCSV(data);
      
      case 'txt':
        return this.convertToText(data);
      
      case 'pdf':
        // PDF generation functionality planned
        return this.convertToText(data);
      
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    const lines: string[] = [];
    
    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === 'object') {
        // Object array to CSV
        const headers = Object.keys(data[0]);
        lines.push(headers.join(','));
        
        data.forEach(item => {
          const values = headers.map(header => {
            const value = item[header];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value.replace(/"/g, '""')}"` 
              : String(value);
          });
          lines.push(values.join(','));
        });
      }
    } else if (typeof data === 'object') {
      // Object to CSV
      lines.push('Key,Value');
      Object.entries(data).forEach(([key, value]) => {
        const sanitizedValue = typeof value === 'string' && value.includes(',')
          ? `"${String(value).replace(/"/g, '""')}"`
          : String(value);
        lines.push(`${key},${sanitizedValue}`);
      });
    }
    
    return lines.join('\n');
  }

  /**
   * Convert data to text format
   */
  private convertToText(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Add security watermark to exported data
   */
  private addSecurityWatermark(data: string, options: SecureExportOptions): string {
    const watermark = [
      '# SECURE EXPORT - ASR-GoT Framework',
      `# Generated: ${new Date().toISOString()}`,
      `# Format: ${options.format}`,
      `# Redaction Level: ${options.redactionLevel}`,
      `# Purpose: ${options.purpose}`,
      `# Recipient: ${options.recipientType}`,
      '# WARNING: This export may contain redacted information for security.',
      '# Do not redistribute without proper authorization.',
      '# ============================================================',
      '',
      data
    ];
    
    return watermark.join('\n');
  }

  /**
   * Create debug-safe summary
   */
  private createDebugSafeSummary(debugData: any): any {
    return {
      timestamp: new Date().toISOString(),
      type: 'debug-export',
      summary: dataSanitizer.createSafeSummary(debugData),
      systemInfo: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.pathname : 'Unknown',
        timestamp: new Date().toISOString()
      },
      warnings: [
        'This is a debug export with sensitive data redacted',
        'Full data not included for security reasons',
        'Contact support for detailed debugging assistance'
      ]
    };
  }

  /**
   * Calculate data size in bytes
   */
  private calculateDataSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  /**
   * Log export activity for audit trail
   */
  private logExportActivity(
    sessionId: string,
    originalData: any,
    options: SecureExportOptions,
    redactionCount: number,
    sizeBytes: number
  ): string {
    const auditId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const auditLog: ExportAuditLog = {
      timestamp: new Date().toISOString(),
      sessionId,
      dataTypes: this.getDataTypes(originalData),
      format: options.format,
      sizeBytes,
      redactionCount,
      purpose: options.purpose,
      recipientType: options.recipientType,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ipAddress: undefined // Would be set server-side
    };

    this.auditLogs.push(auditLog);
    
    // Keep only last 1000 audit logs in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    return auditId;
  }

  /**
   * Identify data types in export
   */
  private getDataTypes(data: any): string[] {
    const types = new Set<string>();
    
    if (data?.nodes) types.add('graph_nodes');
    if (data?.edges) types.add('graph_edges');
    if (data?.stageResults) types.add('stage_results');
    if (data?.researchContext) types.add('research_context');
    if (data?.hypotheses) types.add('hypotheses');
    if (data?.errorLogs) types.add('error_logs');
    
    return Array.from(types);
  }

  /**
   * Get audit logs for review
   */
  public getAuditLogs(limit: number = 100): ExportAuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  /**
   * Clear audit logs (admin function)
   */
  public clearAuditLogs(): void {
    this.auditLogs = [];
  }

  /**
   * Get export statistics
   */
  public getExportStatistics(): any {
    const recentLogs = this.auditLogs.slice(-100);
    
    return {
      totalExports: this.auditLogs.length,
      recentExports: recentLogs.length,
      averageSize: recentLogs.reduce((sum, log) => sum + log.sizeBytes, 0) / recentLogs.length,
      totalRedactions: recentLogs.reduce((sum, log) => sum + log.redactionCount, 0),
      formatDistribution: recentLogs.reduce((dist, log) => {
        dist[log.format] = (dist[log.format] || 0) + 1;
        return dist;
      }, {} as Record<string, number>)
    };
  }
}

// Export singleton instance
export const secureExporter = SecureExportService.getInstance();