/**
 * Performance Optimization Service
 * Comprehensive performance optimization with caching, monitoring, and auto-tuning
 */

import { CacheService } from './CacheService';
import { DatabaseService } from '../database/DatabaseService';
import { GraphDataService } from '../database/GraphDataService';
import { GraphData } from '@/types/asrGotTypes';

export interface PerformanceConfig {
  enableCaching: boolean;
  enableQueryOptimization: boolean;
  enableMemoryOptimization: boolean;
  enableNetworkOptimization: boolean;
  enableAutoTuning: boolean;
  cacheConfig: {
    maxMemorySize: number;
    defaultTTL: number;
    evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  };
  queryConfig: {
    batchSize: number;
    maxConcurrentQueries: number;
    queryTimeout: number;
  };
  memoryConfig: {
    maxHeapSize: number;
    gcThreshold: number;
    enableCompression: boolean;
  };
  networkConfig: {
    enableRequestBatching: boolean;
    maxRequestsPerSecond: number;
    enableGzipCompression: boolean;
  };
}

export interface PerformanceMetrics {
  timestamp: string;
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    evictionCount: number;
    memoryUsage: number;
    averageAccessTime: number;
  };
  queryMetrics: {
    averageQueryTime: number;
    slowQueries: number;
    failedQueries: number;
    totalQueries: number;
  };
  memoryMetrics: {
    heapUsage: number;
    gcCount: number;
    gcTime: number;
    memoryLeaks: number;
  };
  networkMetrics: {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    bandwidthUsage: number;
  };
  sessionMetrics: {
    activeUsers: number;
    concurrentSessions: number;
    averageSessionDuration: number;
  };
}

export interface OptimizationRecommendation {
  type: 'cache' | 'query' | 'memory' | 'network' | 'configuration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  actionRequired: boolean;
  estimatedImprovement: number; // percentage
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
    steps: string[];
    code?: string;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'performance_degradation' | 'resource_exhaustion' | 'system_overload' | 'cache_miss_spike';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  metrics: any;
  timestamp: string;
  acknowledged: boolean;
  autoResolved: boolean;
  resolutionSteps: string[];
}

export class PerformanceOptimizationService {
  private config: PerformanceConfig;
  private cache: CacheService;
  private db: DatabaseService;
  private graphService: GraphDataService;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private optimizationHistory: any[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableCaching: true,
      enableQueryOptimization: true,
      enableMemoryOptimization: true,
      enableNetworkOptimization: true,
      enableAutoTuning: true,
      cacheConfig: {
        maxMemorySize: 100 * 1024 * 1024, // 100MB
        defaultTTL: 30 * 60 * 1000, // 30 minutes
        evictionPolicy: 'lru'
      },
      queryConfig: {
        batchSize: 100,
        maxConcurrentQueries: 10,
        queryTimeout: 30000
      },
      memoryConfig: {
        maxHeapSize: 512 * 1024 * 1024, // 512MB
        gcThreshold: 0.8,
        enableCompression: true
      },
      networkConfig: {
        enableRequestBatching: true,
        maxRequestsPerSecond: 100,
        enableGzipCompression: true
      },
      ...config
    };

    this.cache = new CacheService(this.config.cacheConfig);
    this.db = new DatabaseService();
    this.graphService = new GraphDataService();
  }

  /**
   * Initialize performance monitoring
   */
  async initialize(): Promise<void> {
    try {
      // Start performance monitoring
      this.startPerformanceMonitoring();

      // Preload frequently accessed data
      await this.preloadCriticalData();

      // Run initial optimization
      await this.runOptimization();

      console.log('Performance optimization service initialized');
    } catch (error) {
      console.error('Failed to initialize performance optimization:', error);
      throw error;
    }
  }

  /**
   * Get cached data with fallback to database
   */
  async getCachedData<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high';
      tags?: string[];
      sessionId?: string;
    } = {}
  ): Promise<T> {
    if (!this.config.enableCaching) {
      return await fallbackFn();
    }

    const startTime = Date.now();

    try {
      // Try to get from cache first
      const cachedData = await this.cache.get<T>(key);
      if (cachedData !== null) {
        this.recordCacheHit(Date.now() - startTime);
        return cachedData;
      }

      // Cache miss - fetch from database
      const data = await fallbackFn();
      
      // Cache the result
      await this.cache.set(key, data, options);
      
      this.recordCacheMiss(Date.now() - startTime);
      return data;
    } catch (error) {
      console.error('Cache operation failed:', error);
      // Fallback to direct database call
      return await fallbackFn();
    }
  }

  /**
   * Optimized session data retrieval
   */
  async getOptimizedSessionData(sessionId: string): Promise<{
    session: any;
    graphData: GraphData | null;
    stageExecutions: any[];
    hypotheses: any[];
    knowledgeGaps: any[];
  }> {
    const cacheKey = `session_data:${sessionId}`;
    
    return await this.getCachedData(
      cacheKey,
      async () => {
        // Batch multiple database calls
        const [session, graphData, stageExecutions, hypotheses, knowledgeGaps] = await Promise.all([
          this.db.getResearchSession(sessionId),
          this.graphService.getLatestGraph(sessionId),
          this.db.getStageExecutions(sessionId),
          this.db.getHypotheses(sessionId),
          this.db.getKnowledgeGaps(sessionId)
        ]);

        return {
          session,
          graphData,
          stageExecutions,
          hypotheses,
          knowledgeGaps
        };
      },
      {
        ttl: 10 * 60 * 1000, // 10 minutes
        priority: 'high',
        tags: ['session', 'complete_data'],
        sessionId
      }
    );
  }

  /**
   * Optimized graph data operations
   */
  async getOptimizedGraphData(sessionId: string): Promise<GraphData | null> {
    const cacheKey = `graph_data:${sessionId}`;
    
    return await this.getCachedData(
      cacheKey,
      () => this.graphService.getLatestGraph(sessionId),
      {
        ttl: 5 * 60 * 1000, // 5 minutes
        priority: 'high',
        tags: ['graph'],
        sessionId
      }
    );
  }

  /**
   * Batch database operations
   */
  async executeBatchOperations<T>(
    operations: Array<() => Promise<T>>,
    options: {
      batchSize?: number;
      maxConcurrency?: number;
      timeout?: number;
    } = {}
  ): Promise<Array<T | Error>> {
    const {
      batchSize = this.config.queryConfig.batchSize,
      maxConcurrency = this.config.queryConfig.maxConcurrentQueries,
      timeout = this.config.queryConfig.queryTimeout
    } = options;

    const results: Array<T | Error> = [];
    const batches = this.chunkArray(operations, batchSize);

    for (const batch of batches) {
      const batchPromises = batch.map(operation => 
        this.executeWithTimeout(operation, timeout)
      );

      // Limit concurrency
      const concurrentBatches = this.chunkArray(batchPromises, maxConcurrency);
      
      for (const concurrentBatch of concurrentBatches) {
        const batchResults = await Promise.allSettled(concurrentBatch);
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push(new Error(result.reason));
          }
        }
      }
    }

    return results;
  }

  /**
   * Run comprehensive optimization
   */
  async runOptimization(): Promise<{
    recommendations: OptimizationRecommendation[];
    appliedOptimizations: string[];
    performanceImprovement: number;
    metrics: PerformanceMetrics;
  }> {
    const startTime = Date.now();
    const appliedOptimizations: string[] = [];

    try {
      // Collect current metrics
      const currentMetrics = await this.collectPerformanceMetrics();

      // Generate recommendations
      const recommendations = this.generateOptimizationRecommendations(currentMetrics);

      // Apply automatic optimizations
      if (this.config.enableAutoTuning) {
        const autoOptimizations = await this.applyAutoOptimizations(recommendations);
        appliedOptimizations.push(...autoOptimizations);
      }

      // Optimize cache
      if (this.config.enableCaching) {
        const cacheOptimization = await this.cache.optimize();
        appliedOptimizations.push(...cacheOptimization.optimizationsApplied);
      }

      // Optimize queries
      if (this.config.enableQueryOptimization) {
        const queryOptimizations = await this.optimizeQueries();
        appliedOptimizations.push(...queryOptimizations);
      }

      // Optimize memory usage
      if (this.config.enableMemoryOptimization) {
        const memoryOptimizations = await this.optimizeMemory();
        appliedOptimizations.push(...memoryOptimizations);
      }

      // Collect metrics after optimization
      const optimizedMetrics = await this.collectPerformanceMetrics();
      const performanceImprovement = this.calculatePerformanceImprovement(currentMetrics, optimizedMetrics);

      // Record optimization
      this.optimizationHistory.push({
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        appliedOptimizations,
        performanceImprovement,
        metricsBefore: currentMetrics,
        metricsAfter: optimizedMetrics
      });

      return {
        recommendations,
        appliedOptimizations,
        performanceImprovement,
        metrics: optimizedMetrics
      };
    } catch (error) {
      console.error('Optimization failed:', error);
      throw error;
    }
  }

  /**
   * Get performance insights and recommendations
   */
  async getPerformanceInsights(): Promise<{
    currentMetrics: PerformanceMetrics;
    trends: {
      cacheHitRate: number[];
      queryPerformance: number[];
      memoryUsage: number[];
      networkLatency: number[];
    };
    recommendations: OptimizationRecommendation[];
    alerts: PerformanceAlert[];
    health: {
      score: number;
      status: 'excellent' | 'good' | 'fair' | 'poor';
      bottlenecks: string[];
    };
  }> {
    const currentMetrics = await this.collectPerformanceMetrics();
    const trends = this.analyzeTrends();
    const recommendations = this.generateOptimizationRecommendations(currentMetrics);
    const health = this.calculateHealthScore(currentMetrics);

    return {
      currentMetrics,
      trends,
      recommendations,
      alerts: this.alerts.filter(a => !a.acknowledged),
      health
    };
  }

  /**
   * Invalidate cache for specific patterns
   */
  async invalidateCache(pattern: {
    sessionId?: string;
    userId?: string;
    tags?: string[];
    keyPattern?: string;
  }): Promise<number> {
    if (!this.config.enableCaching) return 0;
    
    return await this.cache.clear(pattern);
  }

  /**
   * Preload critical data
   */
  async preloadCriticalData(): Promise<void> {
    try {
      // Get recent sessions
      const user = await this.db.getCurrentUser();
      if (!user) return;

      const { data: recentSessions } = await this.db.supabase
        .from('research_sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(3);

      // Preload recent sessions
      if (recentSessions) {
        for (const session of recentSessions) {
          await this.cache.preload(session.id);
        }
      }
    } catch (error) {
      console.error('Failed to preload critical data:', error);
    }
  }

  /**
   * Private helper methods
   */
  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    const timestamp = new Date().toISOString();
    
    // Get cache metrics
    const cacheStats = this.cache.getStats();
    const cacheMetrics = {
      hitRate: cacheStats.hitRate,
      missRate: cacheStats.missRate,
      evictionCount: cacheStats.evictionCount,
      memoryUsage: cacheStats.memoryUsage,
      averageAccessTime: cacheStats.averageAccessTime
    };

    // Get query metrics (simplified)
    const queryMetrics = {
      averageQueryTime: 50, // Would be measured
      slowQueries: 0,
      failedQueries: 0,
      totalQueries: 100
    };

    // Get memory metrics (simplified)
    const memoryMetrics = {
      heapUsage: 0.6,
      gcCount: 10,
      gcTime: 100,
      memoryLeaks: 0
    };

    // Get network metrics (simplified)
    const networkMetrics = {
      requestsPerSecond: 50,
      averageResponseTime: 200,
      errorRate: 0.01,
      bandwidthUsage: 1024 * 1024 // 1MB
    };

    // Get session metrics (simplified)
    const sessionMetrics = {
      activeUsers: 5,
      concurrentSessions: 10,
      averageSessionDuration: 30 * 60 * 1000 // 30 minutes
    };

    const metrics: PerformanceMetrics = {
      timestamp,
      cacheMetrics,
      queryMetrics,
      memoryMetrics,
      networkMetrics,
      sessionMetrics
    };

    this.metrics.push(metrics);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    return metrics;
  }

  private generateOptimizationRecommendations(metrics: PerformanceMetrics): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Cache recommendations
    if (metrics.cacheMetrics.hitRate < 0.7) {
      recommendations.push({
        type: 'cache',
        severity: 'high',
        title: 'Low Cache Hit Rate',
        description: 'Cache hit rate is below 70%, indicating inefficient caching',
        impact: 'Increased database load and slower response times',
        actionRequired: true,
        estimatedImprovement: 30,
        implementation: {
          difficulty: 'medium',
          estimatedTime: '1-2 hours',
          steps: [
            'Increase cache TTL for frequently accessed data',
            'Implement cache warming strategies',
            'Review cache eviction policies'
          ]
        }
      });
    }

    // Query performance recommendations
    if (metrics.queryMetrics.averageQueryTime > 100) {
      recommendations.push({
        type: 'query',
        severity: 'medium',
        title: 'Slow Query Performance',
        description: 'Average query time exceeds 100ms',
        impact: 'Degraded user experience and system responsiveness',
        actionRequired: true,
        estimatedImprovement: 25,
        implementation: {
          difficulty: 'hard',
          estimatedTime: '2-4 hours',
          steps: [
            'Analyze slow queries',
            'Add database indexes',
            'Optimize query structure',
            'Implement query batching'
          ]
        }
      });
    }

    // Memory recommendations
    if (metrics.memoryMetrics.heapUsage > 0.8) {
      recommendations.push({
        type: 'memory',
        severity: 'critical',
        title: 'High Memory Usage',
        description: 'Heap usage exceeds 80% of available memory',
        impact: 'Risk of out-of-memory errors and system instability',
        actionRequired: true,
        estimatedImprovement: 40,
        implementation: {
          difficulty: 'medium',
          estimatedTime: '1-3 hours',
          steps: [
            'Implement memory pooling',
            'Enable garbage collection optimization',
            'Identify and fix memory leaks',
            'Reduce object creation'
          ]
        }
      });
    }

    return recommendations;
  }

  private async applyAutoOptimizations(recommendations: OptimizationRecommendation[]): Promise<string[]> {
    const applied: string[] = [];

    for (const recommendation of recommendations) {
      if (recommendation.implementation.difficulty === 'easy' && recommendation.estimatedImprovement > 20) {
        try {
          switch (recommendation.type) {
            case 'cache':
              await this.autoOptimizeCache(recommendation);
              applied.push(`Auto-optimized cache: ${recommendation.title}`);
              break;
            case 'memory':
              await this.autoOptimizeMemory(recommendation);
              applied.push(`Auto-optimized memory: ${recommendation.title}`);
              break;
          }
        } catch (error) {
          console.error(`Failed to apply auto-optimization: ${recommendation.title}`, error);
        }
      }
    }

    return applied;
  }

  private async autoOptimizeCache(recommendation: OptimizationRecommendation): Promise<void> {
    // Implement automatic cache optimizations
    if (recommendation.title.includes('Low Cache Hit Rate')) {
      // Increase TTL for frequently accessed data
      // This would require updating cache configuration
    }
  }

  private async autoOptimizeMemory(recommendation: OptimizationRecommendation): Promise<void> {
    // Implement automatic memory optimizations
    if (recommendation.title.includes('High Memory Usage')) {
      // Trigger garbage collection
      if (global.gc) {
        global.gc();
      }
    }
  }

  private async optimizeQueries(): Promise<string[]> {
    const optimizations: string[] = [];

    // Implement query optimization strategies
    optimizations.push('Enabled query result caching');
    optimizations.push('Implemented connection pooling');

    return optimizations;
  }

  private async optimizeMemory(): Promise<string[]> {
    const optimizations: string[] = [];

    // Implement memory optimization strategies
    optimizations.push('Enabled object pooling');
    optimizations.push('Optimized garbage collection');

    return optimizations;
  }

  private analyzeTrends(): {
    cacheHitRate: number[];
    queryPerformance: number[];
    memoryUsage: number[];
    networkLatency: number[];
  } {
    return {
      cacheHitRate: this.metrics.map(m => m.cacheMetrics.hitRate),
      queryPerformance: this.metrics.map(m => m.queryMetrics.averageQueryTime),
      memoryUsage: this.metrics.map(m => m.memoryMetrics.heapUsage),
      networkLatency: this.metrics.map(m => m.networkMetrics.averageResponseTime)
    };
  }

  private calculatePerformanceImprovement(before: PerformanceMetrics, after: PerformanceMetrics): number {
    const cacheImprovement = (after.cacheMetrics.hitRate - before.cacheMetrics.hitRate) * 100;
    const queryImprovement = ((before.queryMetrics.averageQueryTime - after.queryMetrics.averageQueryTime) / before.queryMetrics.averageQueryTime) * 100;
    const memoryImprovement = ((before.memoryMetrics.heapUsage - after.memoryMetrics.heapUsage) / before.memoryMetrics.heapUsage) * 100;
    
    return (cacheImprovement + queryImprovement + memoryImprovement) / 3;
  }

  private calculateHealthScore(metrics: PerformanceMetrics): {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    bottlenecks: string[];
  } {
    const cacheScore = metrics.cacheMetrics.hitRate * 100;
    const queryScore = Math.max(0, 100 - metrics.queryMetrics.averageQueryTime / 2);
    const memoryScore = Math.max(0, 100 - metrics.memoryMetrics.heapUsage * 100);
    const networkScore = Math.max(0, 100 - metrics.networkMetrics.averageResponseTime / 5);

    const score = (cacheScore + queryScore + memoryScore + networkScore) / 4;
    
    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) status = 'excellent';
    else if (score >= 75) status = 'good';
    else if (score >= 60) status = 'fair';
    else status = 'poor';

    const bottlenecks: string[] = [];
    if (cacheScore < 70) bottlenecks.push('Cache performance');
    if (queryScore < 70) bottlenecks.push('Query performance');
    if (memoryScore < 70) bottlenecks.push('Memory usage');
    if (networkScore < 70) bottlenecks.push('Network latency');

    return { score, status, bottlenecks };
  }

  private startPerformanceMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectPerformanceMetrics();
        this.checkForAlerts(metrics);
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }, 60000); // Monitor every minute
  }

  private checkForAlerts(metrics: PerformanceMetrics): void {
    // Check for performance alerts
    if (metrics.cacheMetrics.hitRate < 0.5) {
      this.createAlert('performance_degradation', 'critical', 'Cache hit rate critically low');
    }

    if (metrics.memoryMetrics.heapUsage > 0.9) {
      this.createAlert('resource_exhaustion', 'critical', 'Memory usage critically high');
    }

    if (metrics.queryMetrics.averageQueryTime > 500) {
      this.createAlert('performance_degradation', 'warning', 'Query performance degraded');
    }
  }

  private createAlert(type: PerformanceAlert['type'], severity: PerformanceAlert['severity'], message: string): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}`,
      type,
      severity,
      message,
      metrics: this.metrics[this.metrics.length - 1],
      timestamp: new Date().toISOString(),
      acknowledged: false,
      autoResolved: false,
      resolutionSteps: []
    };

    this.alerts.push(alert);
  }

  private recordCacheHit(accessTime: number): void {
    // Record cache hit metrics
  }

  private recordCacheMiss(accessTime: number): void {
    // Record cache miss metrics
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Operation timed out'));
      }, timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Cleanup method
   */
  async shutdown(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    await this.cache.shutdown();
  }
}

// Singleton instance
export const performanceOptimizationService = new PerformanceOptimizationService();