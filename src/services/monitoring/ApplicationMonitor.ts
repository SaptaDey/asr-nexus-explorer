/**
 * Application Monitoring Service
 * Provides comprehensive monitoring and alerting capabilities
 */

import { config, isProduction } from '@/config/environment';

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface ErrorData {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceData {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class ApplicationMonitor {
  private metrics: MetricData[] = [];
  private errors: ErrorData[] = [];
  private performance: PerformanceData[] = [];
  private alerts: Array<{ type: string; message: string; timestamp: number }> = [];

  constructor() {
    this.setupGlobalErrorHandling();
    this.setupPerformanceMonitoring();
    
    if (config.ENABLE_PERFORMANCE_MONITORING) {
      this.startMetricsCollection();
    }
  }

  // Metrics collection
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);
    this.checkMetricThresholds(metric);
    
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Error tracking
  recordError(error: Error | string, context?: Record<string, unknown>, severity: ErrorData['severity'] = 'medium'): void {
    const errorData: ErrorData = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
      timestamp: Date.now(),
      severity,
    };

    this.errors.push(errorData);
    
    if (config.ENABLE_ERROR_REPORTING) {
      this.reportError(errorData);
    }

    // Keep only last 500 errors in memory
    if (this.errors.length > 500) {
      this.errors = this.errors.slice(-500);
    }
  }

  // Performance monitoring
  recordPerformance(operation: string, duration: number, metadata?: Record<string, unknown>): void {
    const perfData: PerformanceData = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.performance.push(perfData);
    this.checkPerformanceThresholds(perfData);

    // Keep only last 500 performance records
    if (this.performance.length > 500) {
      this.performance = this.performance.slice(-500);
    }
  }

  // Performance measurement wrapper
  async measurePerformance<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordPerformance(operation, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordPerformance(operation, duration, { ...metadata, error: true });
      throw error;
    }
  }

  // Alerting system
  createAlert(type: string, message: string): void {
    const alert = {
      type,
      message,
      timestamp: Date.now(),
    };

    this.alerts.push(alert);
    console.warn(`🚨 Alert: ${type} - ${message}`);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  // Health check
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      errorRate: number;
      avgResponseTime: number;
      memoryUsage: number;
    };
    timestamp: number;
  } {
    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;

    const recentErrors = this.errors.filter(e => e.timestamp > last5Minutes);
    const recentPerf = this.performance.filter(p => p.timestamp > last5Minutes);

    const errorRate = recentErrors.length / Math.max(recentPerf.length, 1);
    const avgResponseTime = recentPerf.length > 0 
      ? recentPerf.reduce((sum, p) => sum + p.duration, 0) / recentPerf.length 
      : 0;

    const memoryUsage = this.getMemoryUsage();

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (errorRate > 0.1 || avgResponseTime > 5000 || memoryUsage > 0.9) {
      status = 'unhealthy';
    } else if (errorRate > 0.05 || avgResponseTime > 2000 || memoryUsage > 0.7) {
      status = 'degraded';
    }

    return {
      status,
      metrics: {
        errorRate,
        avgResponseTime,
        memoryUsage,
      },
      timestamp: now,
    };
  }

  // Export monitoring data
  exportData(): {
    metrics: MetricData[];
    errors: ErrorData[];
    performance: PerformanceData[];
    alerts: Array<{ type: string; message: string; timestamp: number }>;
    health: ReturnType<ApplicationMonitor['getHealthStatus']>;
  } {
    return {
      metrics: [...this.metrics],
      errors: [...this.errors],
      performance: [...this.performance],
      alerts: [...this.alerts],
      health: this.getHealthStatus(),
    };
  }

  // Private methods
  private setupGlobalErrorHandling(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.recordError(event.error || event.message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }, 'high');
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.recordError(event.reason, { type: 'unhandledRejection' }, 'high');
      });
    }
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor navigation timing
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
          this.recordPerformance('page_load', perfData.loadEventEnd - perfData.navigationStart);
          this.recordPerformance('dom_ready', perfData.domContentLoadedEventEnd - perfData.navigationStart);
        }
      });
    }
  }

  private startMetricsCollection(): void {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.recordMetric('memory_usage', this.getMemoryUsage());
      this.recordMetric('active_connections', this.getActiveConnections());
      this.recordMetric('cache_hit_rate', this.getCacheHitRate());
    }, 30000);
  }

  private checkMetricThresholds(metric: MetricData): void {
    switch (metric.name) {
      case 'memory_usage':
        if (metric.value > 0.9) {
          this.createAlert('memory', 'High memory usage detected');
        }
        break;
      case 'error_rate':
        if (metric.value > 0.1) {
          this.createAlert('errors', 'High error rate detected');
        }
        break;
    }
  }

  private checkPerformanceThresholds(perfData: PerformanceData): void {
    if (perfData.duration > 10000) { // 10 seconds
      this.createAlert('performance', `Slow operation detected: ${perfData.operation} took ${perfData.duration}ms`);
    }
  }

  private reportError(error: ErrorData): void {
    if (isProduction && error.severity === 'critical') {
      // In production, send to external error reporting service
      console.error('Critical error reported:', error);
    } else {
      console.error('Error reported:', error);
    }
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window as any).performance) {
      const memory = (window as any).performance.memory;
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
    return 0;
  }

  private getActiveConnections(): number {
    // Placeholder - would be implemented based on actual connection tracking
    return 0;
  }

  private getCacheHitRate(): number {
    // Placeholder - would be implemented based on actual cache metrics
    return 0.8;
  }
}

export const applicationMonitor = new ApplicationMonitor();

// React hook for monitoring
export const useMonitoring = () => {
  return {
    recordMetric: (name: string, value: number, tags?: Record<string, string>) => 
      applicationMonitor.recordMetric(name, value, tags),
    recordError: (error: Error | string, context?: Record<string, unknown>, severity?: ErrorData['severity']) => 
      applicationMonitor.recordError(error, context, severity),
    recordPerformance: (operation: string, duration: number, metadata?: Record<string, unknown>) => 
      applicationMonitor.recordPerformance(operation, duration, metadata),
    measurePerformance: <T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, unknown>) => 
      applicationMonitor.measurePerformance(operation, fn, metadata),
    getHealthStatus: () => applicationMonitor.getHealthStatus(),
    exportData: () => applicationMonitor.exportData(),
  };
};

export default applicationMonitor;