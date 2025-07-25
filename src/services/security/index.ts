
/**
 * Security Services Index
 * Central export point for all security-related services
 */

// Core security services
export { securityInitializer } from './SecurityInitializer';
export { secureLogger } from './SecureConsoleLogger';
export { secureErrorHandler } from './SecureErrorHandler';
export { dataSanitizer } from './DataSanitizationService';
export { secureExporter } from './SecureExportService';

// Initialize security function
export async function initializeSecurity(config?: any) {
  const { securityInitializer } = await import('./SecurityInitializer');
  return securityInitializer.initialize(config);
}

// Safe logging functions
export function safeLog(...args: any[]) {
  try {
    console.log(...args);
  } catch (error) {
    // Fallback to basic logging
    console.log('Log error:', error);
  }
}

export function safeError(...args: any[]) {
  try {
    console.error(...args);
  } catch (error) {
    // Fallback to basic logging
    console.error('Error logging error:', error);
  }
}

export function safeWarn(...args: any[]) {
  try {
    console.warn(...args);
  } catch (error) {
    // Fallback to basic logging
    console.warn('Warning logging error:', error);
  }
}
