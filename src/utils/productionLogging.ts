/**
 * Production Logging Service
 * Replaces console statements with proper logging
 */

import { config, isProduction, isDevelopment } from '@/config/environment';
import { applicationMonitor } from '@/services/monitoring/ApplicationMonitor';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, unknown>;
  stack?: string;
}

class ProductionLogger {
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 1000;

  constructor() {
    // In production, periodically flush logs
    if (isProduction) {
      setInterval(() => this.flushLogs(), 30000); // Every 30 seconds
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const enrichedContext = {
      ...context,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
      }),
    };

    this.log('error', message, enrichedContext, error?.stack);
    
    // Report critical errors to monitoring
    if (error) {
      applicationMonitor.recordError(error, context, 'high');
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, stack?: string): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      stack,
    };

    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }

    // Console output based on environment and log level
    if (this.shouldOutputToConsole(level)) {
      this.outputToConsole(entry);
    }

    // Send to external logging service in production
    if (isProduction && this.shouldSendToExternal(level)) {
      this.sendToExternalService(entry);
    }
  }

  private shouldOutputToConsole(level: LogLevel): boolean {
    const logLevelPriority = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevelPriority = logLevelPriority[config.LOG_LEVEL];
    const entryLevelPriority = logLevelPriority[level];

    return entryLevelPriority >= configLevelPriority;
  }

  private shouldSendToExternal(level: LogLevel): boolean {
    // Only send warnings and errors to external service
    return ['warn', 'error'].includes(level);
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    
    const logMethod = entry.level === 'error' ? console.error :
                     entry.level === 'warn' ? console.warn :
                     entry.level === 'info' ? console.info :
                     console.debug;

    if (entry.context) {
      logMethod(`${prefix} ${entry.message}`, entry.context);
    } else {
      logMethod(`${prefix} ${entry.message}`);
    }

    if (entry.stack && isDevelopment) {
      console.debug('Stack trace:', entry.stack);
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // In a real application, this would send to external logging service
    // For now, we'll just record it in our monitoring system
    if (entry.level === 'error') {
      applicationMonitor.recordError(
        new Error(entry.message), 
        entry.context, 
        'medium'
      );
    }
  }

  private flushLogs(): void {
    // In production, this would flush logs to external service
    if (this.logBuffer.length > 0) {
      console.info(`Flushing ${this.logBuffer.length} log entries`);
      // Clear buffer after flushing
      this.logBuffer = [];
    }
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Create singleton instance
export const logger = new ProductionLogger();

// Convenience functions that replace console.* calls
export const log = {
  debug: (message: string, context?: Record<string, unknown>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, unknown>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, unknown>) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: Record<string, unknown>) => logger.error(message, error, context),
};

// Development helpers
export const devLog = {
  performance: (operation: string, duration: number, metadata?: Record<string, unknown>) => {
    if (isDevelopment) {
      logger.debug(`Performance: ${operation} took ${duration}ms`, metadata);
    }
  },
  
  render: (componentName: string, props?: Record<string, unknown>) => {
    if (isDevelopment) {
      logger.debug(`Rendering ${componentName}`, { props });
    }
  },
  
  api: (method: string, url: string, status: number, duration: number) => {
    if (isDevelopment) {
      logger.debug(`API ${method} ${url} -> ${status} (${duration}ms)`);
    }
  },
};

export default logger;