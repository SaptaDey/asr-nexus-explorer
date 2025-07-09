/**
 * Performance Optimizer Database Adapter
 * Integrates PerformanceOptimizer with Supabase for metrics tracking and optimization
 */

import { DatabaseService, DbPerformanceMetric } from '../DatabaseService';
import { PerformanceOptimizer, OptimizationResult, PerformanceConfig } from '@/services/performance/PerformanceOptimizer';

export class PerformanceAdapter {
  private db: DatabaseService;
  private optimizer: PerformanceOptimizer;

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
    this.optimizer = new PerformanceOptimizer();
  }

  /**
   * Optimize performance and persist metrics
   */
  async optimizeAndTrack(
    sessionId: string,
    operationType: string,
    config: PerformanceConfig
  ): Promise<{
    optimizationResult: OptimizationResult;
    metricsRecorded: DbPerformanceMetric[];
    recommendations: string[];
  }> {
    const startTime = Date.now();
    const metricsRecorded: DbPerformanceMetric[] = [];

    try {
      // Start optimization monitoring
      const optimizationResult = await this.optimizer.optimizePerformance(
        operationType,
        config,
        (metric) => this.recordMetricCallback(sessionId, operationType, metric, metricsRecorded)
      );

      const totalExecutionTime = Date.now() - startTime;

      // Record final optimization summary
      const summaryMetric = await this.db.savePerformanceMetric({
        session_id: sessionId,
        operation_type: `${operationType}_optimization_summary`,
        execution_time_ms: totalExecutionTime,
        memory_usage_mb: optimizationResult.finalMetrics.memoryUsage,
        cpu_usage_percent: optimizationResult.finalMetrics.cpuUsage,
        throughput: optimizationResult.finalMetrics.throughput,
        success_count: optimizationResult.improvements.length,
        error_count: optimizationResult.warnings.length
      });

      metricsRecorded.push(summaryMetric);

      // Generate recommendations based on optimization results
      const recommendations = this.generateOptimizationRecommendations(optimizationResult);

      return {
        optimizationResult,
        metricsRecorded,
        recommendations
      };

    } catch (error) {
      // Record error metric
      await this.db.logError({
        session_id: sessionId,
        error_type: 'performance_optimization_failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'medium',
        resolved: false,
        context: {
          operation_type: operationType,
          config
        }
      });

      throw error;
    }
  }

  /**
   * Analyze performance trends over time
   */
  async analyzePerformanceTrends(
    sessionId: string,
    operationType?: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    trends: {
      executionTimes: Array<{ timestamp: string; value: number }>;
      memoryUsage: Array<{ timestamp: string; value: number }>;
      cpuUsage: Array<{ timestamp: string; value: number }>;
      throughput: Array<{ timestamp: string; value: number }>;
    };
    statistics: {
      avgExecutionTime: number;
      avgMemoryUsage: number;
      avgCpuUsage: number;
      avgThroughput: number;
      totalOperations: number;
      errorRate: number;
    };
    insights: string[];
  }> {
    try {
      let metrics = await this.db.getPerformanceMetrics(sessionId, operationType);

      // Filter by time range if provided
      if (timeRange) {
        metrics = metrics.filter(metric => {
          const metricTime = new Date(metric.created_at);
          return metricTime >= timeRange.start && metricTime <= timeRange.end;
        });
      }

      // Build trends
      const trends = {
        executionTimes: metrics.map(m => ({
          timestamp: m.created_at,
          value: m.execution_time_ms
        })),
        memoryUsage: metrics
          .filter(m => m.memory_usage_mb !== null)
          .map(m => ({
            timestamp: m.created_at,
            value: m.memory_usage_mb!
          })),
        cpuUsage: metrics
          .filter(m => m.cpu_usage_percent !== null)
          .map(m => ({
            timestamp: m.created_at,
            value: m.cpu_usage_percent!
          })),
        throughput: metrics
          .filter(m => m.throughput !== null)
          .map(m => ({
            timestamp: m.created_at,
            value: m.throughput!
          }))
      };

      // Calculate statistics
      const statistics = {
        avgExecutionTime: this.calculateAverage(metrics, 'execution_time_ms'),
        avgMemoryUsage: this.calculateAverage(metrics, 'memory_usage_mb'),
        avgCpuUsage: this.calculateAverage(metrics, 'cpu_usage_percent'),
        avgThroughput: this.calculateAverage(metrics, 'throughput'),
        totalOperations: metrics.reduce((sum, m) => sum + m.success_count, 0),
        errorRate: metrics.reduce((sum, m) => sum + m.error_count, 0) / 
                  Math.max(1, metrics.reduce((sum, m) => sum + m.success_count + m.error_count, 0))
      };

      // Generate insights
      const insights = this.generatePerformanceInsights(trends, statistics);

      return {
        trends,
        statistics,
        insights
      };

    } catch (error) {
      console.error('Failed to analyze performance trends:', error);
      throw error;
    }
  }

  /**
   * Get performance bottlenecks and optimization opportunities
   */
  async identifyBottlenecks(sessionId: string): Promise<{
    bottlenecks: Array<{
      operationType: string;
      avgExecutionTime: number;
      frequency: number;
      severity: 'low' | 'medium' | 'high';
      recommendations: string[];
    }>;
    optimizationOpportunities: Array<{
      area: string;
      potentialImprovement: string;
      difficulty: 'easy' | 'medium' | 'hard';
      priority: number;
    }>;
  }> {
    try {
      const metrics = await this.db.getPerformanceMetrics(sessionId);
      
      // Group by operation type
      const operationGroups = metrics.reduce((groups, metric) => {
        if (!groups[metric.operation_type]) {
          groups[metric.operation_type] = [];
        }
        groups[metric.operation_type].push(metric);
        return groups;
      }, {} as Record<string, DbPerformanceMetric[]>);

      // Identify bottlenecks
      const bottlenecks = Object.entries(operationGroups).map(([operationType, ops]) => {
        const avgExecutionTime = this.calculateAverage(ops, 'execution_time_ms');
        const frequency = ops.length;
        
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (avgExecutionTime > 10000) severity = 'high'; // > 10 seconds
        else if (avgExecutionTime > 5000) severity = 'medium'; // > 5 seconds

        const recommendations = this.generateBottleneckRecommendations(operationType, avgExecutionTime, frequency);

        return {
          operationType,
          avgExecutionTime,
          frequency,
          severity,
          recommendations
        };
      }).sort((a, b) => b.avgExecutionTime - a.avgExecutionTime);

      // Identify optimization opportunities
      const optimizationOpportunities = [
        {
          area: 'Memory Usage',
          potentialImprovement: 'Implement memory pooling and garbage collection optimization',
          difficulty: 'medium' as const,
          priority: this.calculateOptimizationPriority('memory', metrics)
        },
        {
          area: 'CPU Usage',
          potentialImprovement: 'Optimize algorithmic complexity and enable parallelization',
          difficulty: 'hard' as const,
          priority: this.calculateOptimizationPriority('cpu', metrics)
        },
        {
          area: 'I/O Operations',
          potentialImprovement: 'Implement caching and batch operations',
          difficulty: 'easy' as const,
          priority: this.calculateOptimizationPriority('io', metrics)
        }
      ].sort((a, b) => b.priority - a.priority);

      return {
        bottlenecks: bottlenecks.slice(0, 10), // Top 10 bottlenecks
        optimizationOpportunities
      };

    } catch (error) {
      console.error('Failed to identify bottlenecks:', error);
      throw error;
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(sessionId: string): Promise<{
    report: string;
    metrics: any;
    recommendations: string[];
  }> {
    try {
      const [trends, bottlenecks] = await Promise.all([
        this.analyzePerformanceTrends(sessionId),
        this.identifyBottlenecks(sessionId)
      ]);

      const report = this.buildPerformanceReport(trends, bottlenecks);
      
      const recommendations = [
        ...trends.insights,
        ...bottlenecks.optimizationOpportunities.map(opp => opp.potentialImprovement)
      ];

      return {
        report,
        metrics: { trends, bottlenecks },
        recommendations
      };

    } catch (error) {
      console.error('Failed to generate performance report:', error);
      throw error;
    }
  }

  /**
   * Set up real-time performance monitoring
   */
  async setupRealtimeMonitoring(
    sessionId: string,
    thresholds: {
      maxExecutionTime?: number;
      maxMemoryUsage?: number;
      maxCpuUsage?: number;
      minThroughput?: number;
    },
    alertCallback: (alert: any) => void
  ): Promise<() => void> {
    // Subscribe to performance metrics changes
    const subscription = this.db.supabase
      .channel(`performance_monitoring_${sessionId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'performance_metrics',
          filter: `session_id=eq.${sessionId}`
        }, 
        (payload) => {
          const metric = payload.new as DbPerformanceMetric;
          this.checkThresholds(metric, thresholds, alertCallback);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Private helper methods
   */
  private async recordMetricCallback(
    sessionId: string,
    operationType: string,
    metric: any,
    metricsArray: DbPerformanceMetric[]
  ): Promise<void> {
    try {
      const dbMetric = await this.db.savePerformanceMetric({
        session_id: sessionId,
        operation_type: operationType,
        execution_time_ms: metric.executionTime || 0,
        memory_usage_mb: metric.memoryUsage,
        cpu_usage_percent: metric.cpuUsage,
        throughput: metric.throughput,
        success_count: metric.successCount || 1,
        error_count: metric.errorCount || 0
      });
      
      metricsArray.push(dbMetric);
    } catch (error) {
      console.error('Failed to record performance metric:', error);
    }
  }

  private generateOptimizationRecommendations(result: OptimizationResult): string[] {
    const recommendations: string[] = [];
    
    result.improvements.forEach(improvement => {
      recommendations.push(`Applied ${improvement.type}: ${improvement.description}`);
    });

    result.warnings.forEach(warning => {
      recommendations.push(`Warning: ${warning}`);
    });

    if (result.finalMetrics.memoryUsage > 1000) {
      recommendations.push('Consider memory optimization strategies');
    }

    if (result.finalMetrics.cpuUsage > 80) {
      recommendations.push('CPU usage high - consider algorithmic optimization');
    }

    return recommendations;
  }

  private calculateAverage(metrics: DbPerformanceMetric[], field: keyof DbPerformanceMetric): number {
    const values = metrics
      .map(m => m[field] as number)
      .filter(v => v !== null && v !== undefined && !isNaN(v));
    
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
  }

  private generatePerformanceInsights(trends: any, statistics: any): string[] {
    const insights: string[] = [];
    
    if (statistics.avgExecutionTime > 5000) {
      insights.push('Average execution time is high - consider optimization');
    }
    
    if (statistics.errorRate > 0.1) {
      insights.push(`Error rate is ${(statistics.errorRate * 100).toFixed(1)}% - investigate failures`);
    }
    
    if (statistics.avgMemoryUsage > 500) {
      insights.push('Memory usage is elevated - consider memory optimization');
    }
    
    if (trends.executionTimes.length > 5) {
      const recent = trends.executionTimes.slice(-5).map(t => t.value);
      const earlier = trends.executionTimes.slice(0, 5).map(t => t.value);
      const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, v) => sum + v, 0) / earlier.length;
      
      if (recentAvg > earlierAvg * 1.2) {
        insights.push('Performance is degrading over time');
      } else if (recentAvg < earlierAvg * 0.8) {
        insights.push('Performance is improving over time');
      }
    }
    
    return insights;
  }

  private generateBottleneckRecommendations(
    operationType: string,
    avgExecutionTime: number,
    frequency: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (avgExecutionTime > 10000) {
      recommendations.push('Critical bottleneck - immediate optimization required');
    }
    
    if (frequency > 100) {
      recommendations.push('High frequency operation - consider caching');
    }
    
    if (operationType.includes('stage_')) {
      recommendations.push('Consider parallelization for stage processing');
    }
    
    if (operationType.includes('graph')) {
      recommendations.push('Optimize graph algorithms and data structures');
    }
    
    return recommendations;
  }

  private calculateOptimizationPriority(area: string, metrics: DbPerformanceMetric[]): number {
    switch (area) {
      case 'memory':
        return this.calculateAverage(metrics, 'memory_usage_mb') / 100;
      case 'cpu':
        return this.calculateAverage(metrics, 'cpu_usage_percent') / 10;
      case 'io':
        return metrics.length / 10; // Based on frequency
      default:
        return 0.5;
    }
  }

  private buildPerformanceReport(trends: any, bottlenecks: any): string {
    return `
# Performance Analysis Report

## Summary Statistics
- Average Execution Time: ${trends.statistics.avgExecutionTime.toFixed(2)}ms
- Average Memory Usage: ${trends.statistics.avgMemoryUsage.toFixed(2)}MB
- Average CPU Usage: ${trends.statistics.avgCpuUsage.toFixed(2)}%
- Error Rate: ${(trends.statistics.errorRate * 100).toFixed(2)}%

## Top Bottlenecks
${bottlenecks.bottlenecks.slice(0, 5).map((b: any, i: number) => 
  `${i + 1}. ${b.operationType} (${b.avgExecutionTime.toFixed(2)}ms avg, ${b.severity} severity)`
).join('\n')}

## Optimization Opportunities
${bottlenecks.optimizationOpportunities.map((opp: any, i: number) => 
  `${i + 1}. ${opp.area}: ${opp.potentialImprovement} (Priority: ${opp.priority.toFixed(2)})`
).join('\n')}

## Key Insights
${trends.insights.map((insight: string) => `- ${insight}`).join('\n')}
    `.trim();
  }

  private checkThresholds(
    metric: DbPerformanceMetric,
    thresholds: any,
    alertCallback: (alert: any) => void
  ): void {
    const alerts: any[] = [];
    
    if (thresholds.maxExecutionTime && metric.execution_time_ms > thresholds.maxExecutionTime) {
      alerts.push({
        type: 'execution_time_exceeded',
        value: metric.execution_time_ms,
        threshold: thresholds.maxExecutionTime,
        severity: 'high'
      });
    }
    
    if (thresholds.maxMemoryUsage && metric.memory_usage_mb && metric.memory_usage_mb > thresholds.maxMemoryUsage) {
      alerts.push({
        type: 'memory_usage_exceeded',
        value: metric.memory_usage_mb,
        threshold: thresholds.maxMemoryUsage,
        severity: 'medium'
      });
    }
    
    if (thresholds.maxCpuUsage && metric.cpu_usage_percent && metric.cpu_usage_percent > thresholds.maxCpuUsage) {
      alerts.push({
        type: 'cpu_usage_exceeded',
        value: metric.cpu_usage_percent,
        threshold: thresholds.maxCpuUsage,
        severity: 'medium'
      });
    }
    
    alerts.forEach(alertCallback);
  }
}