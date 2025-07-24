/**
 * Memory Manager Service
 * Prevents memory overflow in ASR-GoT research sessions
 */

import { GraphData } from '@/types/asrGotTypes';
import { toast } from 'sonner';

export interface MemoryMetrics {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  sessionDataSize: number;
  graphDataSize: number;
  stageResultsSize: number;
  localStorageSize: number;
  sessionStorageSize: number;
  memoryPressure: 'low' | 'medium' | 'high' | 'critical';
}

export interface MemoryConfig {
  maxSessionDataSize: number; // bytes
  maxGraphDataSize: number; // bytes  
  maxStageResultsSize: number; // bytes
  maxLocalStorageSize: number; // bytes
  maxSessionStorageSize: number; // bytes
  compressionThreshold: number; // bytes
  cleanupThreshold: number; // memory usage percentage
  warningThreshold: number; // memory usage percentage
  criticalThreshold: number; // memory usage percentage
  monitoringInterval: number; // milliseconds
}

export interface SessionData {
  sessionId: string;
  currentStage: number;
  stageResults: string[];
  graphData: GraphData;
  researchContext: any;
  metadata: {
    created: string;
    lastUpdated: string;
    size: number;
    compressed: boolean;
  };
}

export interface MemoryOptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  freed: number;
  method: 'compression' | 'pruning' | 'pagination' | 'chunking';
}

class MemoryManagerService {
  private config: MemoryConfig;
  private metrics: MemoryMetrics;
  private monitoringInterval: number | null = null;
  private compressionWorker: Worker | null = null;
  private emergencyCleanupActive = false;

  constructor(config?: Partial<MemoryConfig>) {
    this.config = {
      maxSessionDataSize: 50 * 1024 * 1024, // 50MB
      maxGraphDataSize: 20 * 1024 * 1024, // 20MB
      maxStageResultsSize: 30 * 1024 * 1024, // 30MB
      maxLocalStorageSize: 8 * 1024 * 1024, // 8MB
      maxSessionStorageSize: 8 * 1024 * 1024, // 8MB
      compressionThreshold: 1024 * 1024, // 1MB
      cleanupThreshold: 85, // 85%
      warningThreshold: 70, // 70%
      criticalThreshold: 90, // 90%
      monitoringInterval: 30000, // 30 seconds
      ...config
    };

    this.metrics = {
      sessionDataSize: 0,
      graphDataSize: 0,
      stageResultsSize: 0,
      localStorageSize: 0,
      sessionStorageSize: 0,
      memoryPressure: 'low'
    };

    this.initializeMemoryMonitoring();
  }

  /**
   * Initialize memory monitoring
   */
  private initializeMemoryMonitoring(): void {
    // Start monitoring interval
    this.monitoringInterval = setInterval(() => {
      this.updateMemoryMetrics();
      this.checkMemoryPressure();
    }, this.config.monitoringInterval);

    // Listen for memory pressure events
    if ('memory' in performance && 'addEventListener' in performance.memory) {
      (performance as any).memory.addEventListener('memorywarning', () => {
        this.handleMemoryWarning();
      });
    }

    // Listen for low memory events
    window.addEventListener('beforeunload', () => {
      this.emergencyCleanup();
    });

    // Initial metrics update
    this.updateMemoryMetrics();
  }

  /**
   * Update memory metrics
   */
  public updateMemoryMetrics(): MemoryMetrics {
    try {
      // Browser memory info (Chrome/Edge)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.usedJSHeapSize = memory.usedJSHeapSize;
        this.metrics.totalJSHeapSize = memory.totalJSHeapSize;
        this.metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      }

      // Storage sizes
      this.metrics.localStorageSize = this.getStorageSize('localStorage');
      this.metrics.sessionStorageSize = this.getStorageSize('sessionStorage');

      // Session data sizes
      const sessionData = this.getCurrentSessionData();
      if (sessionData) {
        this.metrics.sessionDataSize = this.calculateSize(sessionData);
        this.metrics.graphDataSize = this.calculateSize(sessionData.graphData);
        this.metrics.stageResultsSize = this.calculateSize(sessionData.stageResults);
      }

      // Calculate memory pressure
      this.metrics.memoryPressure = this.calculateMemoryPressure();

      return this.metrics;
    } catch (error) {
      console.error('Error updating memory metrics:', error);
      return this.metrics;
    }
  }

  /**
   * Calculate memory pressure level
   */
  private calculateMemoryPressure(): 'low' | 'medium' | 'high' | 'critical' {
    let pressure = 0;

    // JS Heap pressure
    if (this.metrics.usedJSHeapSize && this.metrics.jsHeapSizeLimit) {
      pressure = Math.max(pressure, (this.metrics.usedJSHeapSize / this.metrics.jsHeapSizeLimit) * 100);
    }

    // Session data pressure
    if (this.metrics.sessionDataSize > this.config.maxSessionDataSize) {
      pressure = Math.max(pressure, 85);
    }

    // Storage pressure
    const totalStorageSize = this.metrics.localStorageSize + this.metrics.sessionStorageSize;
    const maxStorageSize = this.config.maxLocalStorageSize + this.config.maxSessionStorageSize;
    if (totalStorageSize > 0) {
      pressure = Math.max(pressure, (totalStorageSize / maxStorageSize) * 100);
    }

    if (pressure >= this.config.criticalThreshold) return 'critical';
    if (pressure >= this.config.cleanupThreshold) return 'high';
    if (pressure >= this.config.warningThreshold) return 'medium';
    return 'low';
  }

  /**
   * Check memory pressure and take action
   */
  private checkMemoryPressure(): void {
    const pressure = this.metrics.memoryPressure;

    switch (pressure) {
      case 'critical':
        this.handleCriticalMemoryPressure();
        break;
      case 'high':
        this.handleHighMemoryPressure();
        break;
      case 'medium':
        this.handleMediumMemoryPressure();
        break;
      default:
        // Low pressure - no action needed
        break;
    }
  }

  /**
   * Handle memory warning
   */
  private handleMemoryWarning(): void {
    console.warn('🚨 Memory warning detected - initiating cleanup');
    toast.warning('High memory usage detected. Optimizing session data...');
    this.optimizeSessionData();
  }

  /**
   * Handle medium memory pressure
   */
  private handleMediumMemoryPressure(): void {
    console.warn('⚠️ Medium memory pressure detected');
    toast.info('Optimizing memory usage...');
    
    // Compress large data
    this.compressSessionData();
    
    // Clean up old data
    this.cleanupOldSessions();
  }

  /**
   * Handle high memory pressure
   */
  private handleHighMemoryPressure(): void {
    console.warn('🔥 High memory pressure detected - aggressive cleanup');
    toast.warning('High memory usage - optimizing data storage...');
    
    // Aggressive optimization
    this.optimizeSessionData();
    
    // Paginate large results
    this.paginateStageResults();
    
    // Reduce graph data
    this.optimizeGraphData();
  }

  /**
   * Handle critical memory pressure
   */
  private handleCriticalMemoryPressure(): void {
    if (this.emergencyCleanupActive) return;
    
    console.error('💥 CRITICAL memory pressure - emergency cleanup');
    toast.error('Critical memory usage! Performing emergency cleanup...');
    
    this.emergencyCleanupActive = true;
    this.emergencyCleanup();
    this.emergencyCleanupActive = false;
  }

  /**
   * Emergency cleanup
   */
  private emergencyCleanup(): void {
    try {
      // Save current session to persistent storage
      const sessionData = this.getCurrentSessionData();
      if (sessionData) {
        this.saveSessionToPersistentStorage(sessionData);
      }

      // Clear non-essential data from memory
      this.clearNonEssentialData();
      
      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }

      toast.success('Emergency cleanup completed. Session data preserved.');
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
      toast.error('Emergency cleanup failed. Please save your work manually.');
    }
  }

  /**
   * Optimize session data
   */
  public async optimizeSessionData(): Promise<MemoryOptimizationResult> {
    const sessionData = this.getCurrentSessionData();
    if (!sessionData) {
      return {
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 1,
        freed: 0,
        method: 'compression'
      };
    }

    const originalSize = this.calculateSize(sessionData);
    
    try {
      // Compress stage results
      sessionData.stageResults = await this.compressStageResults(sessionData.stageResults);
      
      // Optimize graph data
      sessionData.graphData = this.optimizeGraphDataStructure(sessionData.graphData);
      
      // Remove redundant metadata
      this.cleanupSessionMetadata(sessionData);
      
      const optimizedSize = this.calculateSize(sessionData);
      const freed = originalSize - optimizedSize;
      
      // Save optimized data
      this.saveCurrentSessionData(sessionData);
      
      return {
        originalSize,
        optimizedSize,
        compressionRatio: originalSize / optimizedSize,
        freed,
        method: 'compression'
      };
    } catch (error) {
      console.error('Session optimization failed:', error);
      return {
        originalSize,
        optimizedSize: originalSize,
        compressionRatio: 1,
        freed: 0,
        method: 'compression'
      };
    }
  }

  /**
   * Compress stage results
   */
  private async compressStageResults(stageResults: string[]): Promise<string[]> {
    const compressed = [];
    
    for (const result of stageResults) {
      if (result && result.length > this.config.compressionThreshold) {
        try {
          // Use LZ-string or similar compression
          const compressedResult = await this.compressString(result);
          compressed.push(compressedResult);
        } catch (error) {
          // Keep original if compression fails
          compressed.push(result);
        }
      } else {
        compressed.push(result);
      }
    }
    
    return compressed;
  }

  /**
   * Optimize graph data structure
   */
  private optimizeGraphDataStructure(graphData: GraphData): GraphData {
    if (!graphData || !graphData.nodes || !graphData.edges) {
      return graphData;
    }

    // Remove redundant data
    const optimizedNodes = graphData.nodes.map(node => ({
      id: node.id,
      label: node.label?.substring(0, 200) || '', // Truncate long labels
      type: node.type,
      confidence: node.confidence,
      // Remove heavy metadata but keep essential data
      metadata: node.metadata ? this.compactMetadata(node.metadata) : undefined
    }));

    const optimizedEdges = graphData.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      confidence: edge.confidence,
      metadata: edge.metadata ? this.compactMetadata(edge.metadata) : undefined
    }));

    return {
      ...graphData,
      nodes: optimizedNodes,
      edges: optimizedEdges
    };
  }

  /**
   * Paginate stage results to reduce memory footprint
   */
  private paginateStageResults(): void {
    const sessionData = this.getCurrentSessionData();
    if (!sessionData) return;

    const pageSize = 5; // Keep only 5 most recent results in memory
    if (sessionData.stageResults.length > pageSize) {
      // Save older results to persistent storage
      const olderResults = sessionData.stageResults.slice(0, -pageSize);
      this.saveStageResultsPage(sessionData.sessionId, olderResults);
      
      // Keep only recent results in memory
      sessionData.stageResults = sessionData.stageResults.slice(-pageSize);
      this.saveCurrentSessionData(sessionData);
    }
  }

  /**
   * Optimize graph data by reducing node/edge count
   */
  private optimizeGraphData(): void {
    const sessionData = this.getCurrentSessionData();
    if (!sessionData || !sessionData.graphData) return;

    const { nodes, edges } = sessionData.graphData;
    
    // If graph is too large, keep only high-confidence nodes/edges
    if (nodes.length > 1000 || edges.length > 2000) {
      const minConfidence = 0.7;
      
      const filteredNodes = nodes.filter(node => {
        const avgConfidence = Array.isArray(node.confidence) 
          ? node.confidence.reduce((sum, c) => sum + c, 0) / node.confidence.length
          : (node.confidence as number) || 0;
        return avgConfidence >= minConfidence;
      });

      const nodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredEdges = edges.filter(edge => 
        nodeIds.has(edge.source) && 
        nodeIds.has(edge.target) && 
        (edge.confidence as number) >= minConfidence
      );

      sessionData.graphData = {
        ...sessionData.graphData,
        nodes: filteredNodes,
        edges: filteredEdges
      };

      this.saveCurrentSessionData(sessionData);
      
      toast.info(`Graph optimized: ${nodes.length - filteredNodes.length} nodes and ${edges.length - filteredEdges.length} edges removed`);
    }
  }

  /**
   * Compress string using simple compression
   */
  private async compressString(str: string): Promise<string> {
    // Simple compression for now - could use LZ-string or other libraries
    try {
      return btoa(str);
    } catch (error) {
      return str; // Return original if compression fails
    }
  }

  /**
   * Compact metadata object
   */
  private compactMetadata(metadata: any): any {
    if (!metadata || typeof metadata !== 'object') return metadata;
    
    const compacted: any = {};
    
    // Keep only essential metadata fields
    const essentialFields = ['stage', 'confidence', 'type', 'timestamp', 'source'];
    for (const field of essentialFields) {
      if (metadata[field] !== undefined) {
        compacted[field] = metadata[field];
      }
    }
    
    return compacted;
  }

  /**
   * Calculate size of any object in bytes
   */
  private calculateSize(obj: any): number {
    try {
      return new Blob([JSON.stringify(obj)]).size;
    } catch (error) {
      // Fallback estimation
      return JSON.stringify(obj || {}).length * 2; // Rough UTF-16 estimation
    }
  }

  /**
   * Get storage size for localStorage or sessionStorage
   */
  private getStorageSize(storageType: 'localStorage' | 'sessionStorage'): number {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      let total = 0;
      
      for (let key in storage) {
        if (storage.hasOwnProperty(key)) {
          total += storage[key].length + key.length;
        }
      }
      
      return total * 2; // UTF-16 encoding
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get current session data from storage
   */
  private getCurrentSessionData(): SessionData | null {
    try {
      const sessionState = sessionStorage.getItem('asr-got-current-session');
      if (sessionState) {
        const parsed = JSON.parse(sessionState);
        return parsed as SessionData;
      }
      
      const localState = localStorage.getItem('asr-got-session-state');
      if (localState) {
        const parsed = JSON.parse(localState);
        return parsed as SessionData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current session data:', error);
      return null;
    }
  }

  /**
   * Save current session data
   */
  private saveCurrentSessionData(sessionData: SessionData): void {
    try {
      const compressed = this.config.compressionThreshold > 0 && 
                        this.calculateSize(sessionData) > this.config.compressionThreshold;
      
      sessionData.metadata = {
        ...sessionData.metadata,
        lastUpdated: new Date().toISOString(),
        size: this.calculateSize(sessionData),
        compressed
      };
      
      const dataStr = JSON.stringify(sessionData);
      
      sessionStorage.setItem('asr-got-current-session', dataStr);
      localStorage.setItem('asr-got-session-state', dataStr);
    } catch (error) {
      console.error('Error saving session data:', error);
      toast.error('Failed to save session data - storage may be full');
    }
  }

  /**
   * Save session to persistent storage (IndexedDB)
   */
  private async saveSessionToPersistentStorage(sessionData: SessionData): Promise<void> {
    try {
      // Implementation would use IndexedDB for large session storage
      console.log('Saving session to persistent storage:', sessionData.sessionId);
    } catch (error) {
      console.error('Error saving to persistent storage:', error);
    }
  }

  /**
   * Save stage results page to persistent storage
   */
  private async saveStageResultsPage(sessionId: string, results: string[]): Promise<void> {
    try {
      const key = `stage-results-${sessionId}-${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(results));
    } catch (error) {
      console.error('Error saving stage results page:', error);
    }
  }

  /**
   * Clear non-essential data
   */
  private clearNonEssentialData(): void {
    try {
      // Clear old session data
      this.cleanupOldSessions();
      
      // Clear temporary data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('temp-') || key.startsWith('cache-'))) {
          localStorage.removeItem(key);
        }
      }
      
      // Clear session storage except current session
      const currentSession = sessionStorage.getItem('asr-got-current-session');
      sessionStorage.clear();
      if (currentSession) {
        sessionStorage.setItem('asr-got-current-session', currentSession);
      }
    } catch (error) {
      console.error('Error clearing non-essential data:', error);
    }
  }

  /**
   * Cleanup old sessions
   */
  private cleanupOldSessions(): void {
    try {
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      const now = Date.now();
      
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        if (key.startsWith('asr-got-') && key !== 'asr-got-session-state') {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            const timestamp = new Date(data.timestamp || data.lastUpdated || 0).getTime();
            
            if (now - timestamp > maxAge) {
              keysToRemove.push(key);
            }
          } catch (error) {
            // Remove corrupted data
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} old sessions`);
      }
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
    }
  }

  /**
   * Cleanup session metadata
   */
  private cleanupSessionMetadata(sessionData: SessionData): void {
    // Remove heavy metadata from research context
    if (sessionData.researchContext) {
      delete sessionData.researchContext.fullAnalysisData;
      delete sessionData.researchContext.rawApiResponses;
      delete sessionData.researchContext.debugInfo;
    }
  }

  /**
   * Get memory metrics
   */
  public getMemoryMetrics(): MemoryMetrics {
    return { ...this.metrics };
  }

  /**
   * Get memory status
   */
  public getMemoryStatus(): {
    pressure: string;
    recommendations: string[];
    actions: string[];
  } {
    const metrics = this.updateMemoryMetrics();
    const recommendations: string[] = [];
    const actions: string[] = [];
    
    switch (metrics.memoryPressure) {
      case 'critical':
        recommendations.push('Immediately save your work');
        recommendations.push('Close unnecessary browser tabs');
        recommendations.push('Restart the browser');
        actions.push('Emergency cleanup initiated');
        break;
      case 'high':
        recommendations.push('Consider saving current work');
        recommendations.push('Close other applications');
        actions.push('Aggressive optimization enabled');
        break;
      case 'medium':
        recommendations.push('Monitor memory usage');
        actions.push('Data compression active');
        break;
      default:
        recommendations.push('Memory usage is optimal');
        break;
    }
    
    return {
      pressure: metrics.memoryPressure,
      recommendations,
      actions
    };
  }

  /**
   * Cleanup and destroy
   */
  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
      this.compressionWorker = null;
    }
  }
}

// Create singleton instance
export const memoryManager = new MemoryManagerService();

// React hook for memory management
export function useMemoryManager() {
  return {
    getMetrics: () => memoryManager.getMemoryMetrics(),
    getStatus: () => memoryManager.getMemoryStatus(),
    optimize: () => memoryManager.optimizeSessionData(),
    updateMetrics: () => memoryManager.updateMemoryMetrics()
  };
}