/**
 * Security Services Index
 * CRITICAL SECURITY: Central export for all security services
 */

// Core services
export { DataSanitizationService, dataSanitizer } from './DataSanitizationService';
export { SecureConsoleLogger, secureLogger, safeLog, safeInfo, safeWarn, safeError, safeDebug } from './SecureConsoleLogger';
export { SecureErrorHandler, SecureError, secureErrorHandler, createSecureError, handleError, safeErrorForUser } from './SecureErrorHandler';
export { SecureExportService, secureExporter } from './SecureExportService';
export { SecurityInitializer, securityInitializer } from './SecurityInitializer';

// Types
export type { SanitizationConfig, SanitizedData } from './DataSanitizationService';
export type { LogLevel, SecureLogConfig } from './SecureConsoleLogger';
export type { SecureErrorConfig } from './SecureErrorHandler';
export type { ExportSecurity, SecureExportOptions, ExportAuditLog } from './SecureExportService';
export type { SecurityConfig } from './SecurityInitializer';

// Security constants
export const SECURITY_CONSTANTS = {
  REDACTION_PLACEHOLDERS: {
    RESEARCH_CONTENT: '[RESEARCH_DATA_REDACTED]',
    PERSONAL_INFO: '[PII_REDACTED]',
    API_KEYS: '[CREDENTIALS_REDACTED]',
    INTERNAL_PATHS: '[PATH_REDACTED]',
    GENERIC: '[REDACTED_FOR_SECURITY]'
  },
  
  MAX_EXPORT_SIZE_MB: 10,
  MAX_LOG_LENGTH: 500,
  MAX_ERROR_MESSAGE_LENGTH: 200,
  
  PRODUCTION_SETTINGS: {
    DISABLE_CONSOLE_LOGS: true,
    REDACT_ALL_SENSITIVE_DATA: true,
    REQUIRE_EXPLICIT_CONSENT: true,
    ENABLE_AUDIT_LOGGING: true
  }
} as const;

// Utility functions
export function initializeSecurity(config?: Partial<SecurityConfig>) {
  return securityInitializer.initialize(config);
}

export function validateSecurityServices() {
  return securityInitializer.validateSecurity();
}

export function getSecurityStatus() {
  return securityInitializer.getSecurityStatus();
}

// Emergency functions
export function emergencySecurityShutdown() {
  console.warn('🚨 EMERGENCY: Security shutdown initiated');
  securityInitializer.emergencyShutdown();
}

export function isSecurityInitialized() {
  return securityInitializer.isInitialized();
}

// Quick sanitization helpers
export function quickSanitize(data: any) {
  return dataSanitizer.sanitizeData(data);
}

export function sanitizeForConsole(data: any) {
  return dataSanitizer.sanitizeForConsole(data);
}

export function sanitizeForExport(data: any, userConsent: boolean = false) {
  return dataSanitizer.sanitizeForExport(data, userConsent);
}

export function containsSensitiveData(data: any) {
  return dataSanitizer.containsSensitiveData(data);
}

// Error handling helpers
export function secureWrap<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): (...args: Parameters<T>) => ReturnType<T> | SecureError {
  return secureErrorHandler.wrapFunction(fn, context);
}

export function secureWrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | SecureError> {
  return secureErrorHandler.wrapAsyncFunction(fn, context);
}

// Export service helpers
export function secureExport(sessionId: string, data: any, options: SecureExportOptions) {
  return secureExporter.exportSessionData(sessionId, data, options);
}

export function secureDebugExport(debugData: any, options: Omit<SecureExportOptions, 'includeSensitiveData'>) {
  return secureExporter.exportDebugInfo(debugData, options);
}

// Production safety check
if (import.meta.env.MODE === 'production') {
  console.log('🔒 Security services loaded in production mode');
} else {
  console.log('🔍 Security services loaded in development mode');
}