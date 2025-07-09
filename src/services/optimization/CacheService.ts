/**
 * Cache Service for Performance Optimization
 * Implements multi-level caching with database-backed persistence
 */

import { DatabaseService } from '../database/DatabaseService';
import { GraphData } from '@/types/asrGotTypes';

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  size: number; // Estimated size in bytes
  metadata: {
    sessionId?: string;
    userId?: string;
    tags?: string[];
    priority: 'low' | 'medium' | 'high';
    compressed?: boolean;
    encrypted?: boolean;
  };
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  memoryUsage: number;
  diskUsage: number;
  averageAccessTime: number;
  topKeys: Array<{
    key: string;
    accessCount: number;
    size: number;
  }>;
}

export interface CacheConfig {
  maxMemorySize: number; // bytes
  maxDiskSize: number; // bytes
  maxEntries: number;
  defaultTTL: number; // milliseconds
  cleanupInterval: number; // milliseconds
  compressionThreshold: number; // bytes
  enablePersistence: boolean;
  enableEncryption: boolean;
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'ttl';
}

export class CacheService {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = []; // For LRU
  private accessFrequency: Map<string, number> = new Map(); // For LFU
  private stats: CacheStats;
  private config: CacheConfig;
  private db: DatabaseService;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxMemorySize: 100 * 1024 * 1024, // 100MB
      maxDiskSize: 1024 * 1024 * 1024, // 1GB
      maxEntries: 10000,
      defaultTTL: 60 * 60 * 1000, // 1 hour
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      compressionThreshold: 1024, // 1KB
      enablePersistence: true,
      enableEncryption: false,
      evictionPolicy: 'lru',
      ...config
    };

    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      memoryUsage: 0,
      diskUsage: 0,
      averageAccessTime: 0,
      topKeys: []
    };

    this.db = new DatabaseService();
    this.startCleanupTimer();
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry) {
        if (this.isExpired(memoryEntry)) {
          this.memoryCache.delete(key);
          this.updateAccessOrder(key, false);
        } else {
          this.updateAccessStats(key, memoryEntry);
          this.recordCacheHit(Date.now() - startTime);
          return memoryEntry.value as T;
        }
      }

      // Check disk cache if persistence is enabled
      if (this.config.enablePersistence) {
        const diskEntry = await this.getFromDisk(key);
        if (diskEntry && !this.isExpired(diskEntry)) {
          // Promote to memory cache
          this.memoryCache.set(key, diskEntry);
          this.updateAccessStats(key, diskEntry);
          this.recordCacheHit(Date.now() - startTime);
          return diskEntry.value as T;
        }
      }

      this.recordCacheMiss(Date.now() - startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.recordCacheMiss(Date.now() - startTime);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T = any>(
    key: string, 
    value: T, 
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high';
      tags?: string[];
      sessionId?: string;
      userId?: string;
      compress?: boolean;
      encrypt?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const size = this.calculateSize(value);
      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        ttl: options.ttl || this.config.defaultTTL,
        accessCount: 1,
        size,
        metadata: {
          sessionId: options.sessionId,
          userId: options.userId,
          tags: options.tags || [],
          priority: options.priority || 'medium',
          compressed: options.compress || (size > this.config.compressionThreshold),
          encrypted: options.encrypt || this.config.enableEncryption
        }
      };

      // Compress if needed
      if (entry.metadata.compressed) {
        entry.value = await this.compressValue(value) as T;
        entry.size = this.calculateSize(entry.value);
      }

      // Encrypt if needed
      if (entry.metadata.encrypted) {
        entry.value = await this.encryptValue(entry.value) as T;
      }

      // Check if we need to evict entries
      await this.ensureCapacity(entry.size);

      // Store in memory cache
      this.memoryCache.set(key, entry);
      this.updateAccessOrder(key, true);

      // Store in disk cache if persistence is enabled
      if (this.config.enablePersistence) {
        await this.saveToDisk(entry);
      }

      this.updateStats();
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const memoryDeleted = this.memoryCache.delete(key);
      this.updateAccessOrder(key, false);
      
      let diskDeleted = false;
      if (this.config.enablePersistence) {
        diskDeleted = await this.deleteFromDisk(key);
      }

      if (memoryDeleted || diskDeleted) {
        this.updateStats();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Clear cache by pattern or tags
   */
  async clear(pattern?: {
    keyPattern?: string;
    tags?: string[];
    sessionId?: string;
    userId?: string;
    olderThan?: number;
  }): Promise<number> {
    try {
      let clearedCount = 0;

      // Clear memory cache
      const keysToDelete: string[] = [];
      for (const [key, entry] of this.memoryCache) {
        if (this.shouldClear(key, entry, pattern)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        this.memoryCache.delete(key);
        this.updateAccessOrder(key, false);
        clearedCount++;
      }

      // Clear disk cache if persistence is enabled
      if (this.config.enablePersistence && pattern) {
        const diskClearedCount = await this.clearFromDisk(pattern);
        clearedCount += diskClearedCount;
      }

      this.updateStats();
      return clearedCount;
    } catch (error) {
      console.error('Cache clear error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get cache health metrics
   */
  getHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      memoryUsagePercent: number;
      diskUsagePercent: number;
      hitRatePercent: number;
      averageAccessTime: number;
      evictionRate: number;
    };
    recommendations: string[];
  } {
    const memoryUsagePercent = (this.stats.memoryUsage / this.config.maxMemorySize) * 100;
    const diskUsagePercent = (this.stats.diskUsage / this.config.maxDiskSize) * 100;
    const hitRatePercent = this.stats.hitRate * 100;
    const evictionRate = this.stats.evictionCount / Math.max(1, this.stats.totalEntries);

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const recommendations: string[] = [];

    if (memoryUsagePercent > 90) {
      status = 'critical';
      recommendations.push('Memory usage is critically high - consider increasing cache size or reducing TTL');
    } else if (memoryUsagePercent > 75) {
      status = 'warning';
      recommendations.push('Memory usage is high - monitor cache performance');
    }

    if (hitRatePercent < 50) {
      status = status === 'critical' ? 'critical' : 'warning';
      recommendations.push('Low cache hit rate - consider adjusting cache strategy');
    }

    if (this.stats.averageAccessTime > 50) {
      recommendations.push('High average access time - consider optimizing cache operations');
    }

    if (evictionRate > 0.1) {
      recommendations.push('High eviction rate - consider increasing cache size');
    }

    return {
      status,
      metrics: {
        memoryUsagePercent,
        diskUsagePercent,
        hitRatePercent,
        averageAccessTime: this.stats.averageAccessTime,
        evictionRate
      },
      recommendations
    };
  }

  /**
   * Optimize cache performance
   */
  async optimize(): Promise<{
    optimizationsApplied: string[];
    performance: {
      before: CacheStats;
      after: CacheStats;
    };
  }> {
    const beforeStats = this.getStats();
    const optimizationsApplied: string[] = [];

    try {
      // Clean up expired entries
      const expiredCount = await this.cleanupExpired();
      if (expiredCount > 0) {
        optimizationsApplied.push(`Cleaned up ${expiredCount} expired entries`);
      }

      // Compress large entries
      const compressedCount = await this.compressLargeEntries();
      if (compressedCount > 0) {
        optimizationsApplied.push(`Compressed ${compressedCount} large entries`);
      }

      // Optimize access order for LRU
      if (this.config.evictionPolicy === 'lru') {
        this.optimizeAccessOrder();
        optimizationsApplied.push('Optimized LRU access order');
      }

      // Defragment disk cache
      if (this.config.enablePersistence) {
        await this.defragmentDiskCache();
        optimizationsApplied.push('Defragmented disk cache');
      }

      const afterStats = this.getStats();

      return {
        optimizationsApplied,
        performance: {
          before: beforeStats,
          after: afterStats
        }
      };
    } catch (error) {
      console.error('Cache optimization error:', error);
      return {
        optimizationsApplied,
        performance: {
          before: beforeStats,
          after: beforeStats
        }
      };
    }
  }

  /**
   * Preload cache with frequently accessed data
   */
  async preload(sessionId: string): Promise<void> {
    try {
      // Load frequently accessed session data
      const [session, graphData, recentStageExecutions] = await Promise.all([
        this.db.getResearchSession(sessionId),
        this.db.getGraphData(sessionId),
        this.db.getStageExecutions(sessionId)
      ]);

      // Cache session data
      if (session) {
        await this.set(`session:${sessionId}`, session, {
          ttl: 30 * 60 * 1000, // 30 minutes
          priority: 'high',
          sessionId,
          tags: ['session', 'preload']
        });
      }

      // Cache graph data
      if (graphData) {
        await this.set(`graph:${sessionId}`, graphData, {
          ttl: 15 * 60 * 1000, // 15 minutes
          priority: 'high',
          sessionId,
          tags: ['graph', 'preload'],
          compress: true
        });
      }

      // Cache recent stage executions
      if (recentStageExecutions) {
        await this.set(`stages:${sessionId}`, recentStageExecutions, {
          ttl: 10 * 60 * 1000, // 10 minutes
          priority: 'medium',
          sessionId,
          tags: ['stages', 'preload']
        });
      }
    } catch (error) {
      console.error('Cache preload error:', error);
    }
  }

  /**
   * Private helper methods
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  private calculateSize(value: any): number {
    return new Blob([JSON.stringify(value)]).size;
  }

  private updateAccessStats(key: string, entry: CacheEntry): void {
    entry.accessCount++;
    entry.timestamp = Date.now();
    this.updateAccessOrder(key, true);
    this.accessFrequency.set(key, (this.accessFrequency.get(key) || 0) + 1);
  }

  private updateAccessOrder(key: string, accessed: boolean): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    if (accessed) {
      this.accessOrder.push(key);
    }
  }

  private async ensureCapacity(newEntrySize: number): Promise<void> {
    const currentSize = Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    if (currentSize + newEntrySize > this.config.maxMemorySize ||
        this.memoryCache.size >= this.config.maxEntries) {
      await this.evictEntries(newEntrySize);
    }
  }

  private async evictEntries(spaceNeeded: number): Promise<void> {
    let spaceFreed = 0;
    const entriesToEvict: string[] = [];

    switch (this.config.evictionPolicy) {
      case 'lru':
        // Evict least recently used
        for (const key of this.accessOrder) {
          const entry = this.memoryCache.get(key);
          if (entry) {
            entriesToEvict.push(key);
            spaceFreed += entry.size;
            if (spaceFreed >= spaceNeeded) break;
          }
        }
        break;

      case 'lfu':
        // Evict least frequently used
        const sortedByFrequency = Array.from(this.accessFrequency.entries())
          .sort((a, b) => a[1] - b[1]);
        
        for (const [key] of sortedByFrequency) {
          const entry = this.memoryCache.get(key);
          if (entry) {
            entriesToEvict.push(key);
            spaceFreed += entry.size;
            if (spaceFreed >= spaceNeeded) break;
          }
        }
        break;

      case 'fifo':
        // Evict first in, first out
        const sortedByTimestamp = Array.from(this.memoryCache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        for (const [key, entry] of sortedByTimestamp) {
          entriesToEvict.push(key);
          spaceFreed += entry.size;
          if (spaceFreed >= spaceNeeded) break;
        }
        break;

      case 'ttl':
        // Evict entries with shortest TTL remaining
        const now = Date.now();
        const sortedByTTL = Array.from(this.memoryCache.entries())
          .sort((a, b) => (a[1].timestamp + a[1].ttl) - (b[1].timestamp + b[1].ttl));
        
        for (const [key, entry] of sortedByTTL) {
          entriesToEvict.push(key);
          spaceFreed += entry.size;
          if (spaceFreed >= spaceNeeded) break;
        }
        break;
    }

    // Evict selected entries
    for (const key of entriesToEvict) {
      await this.evictEntry(key);
    }
  }

  private async evictEntry(key: string): Promise<void> {
    const entry = this.memoryCache.get(key);
    if (entry) {
      // Move to disk cache if persistence is enabled and entry is valuable
      if (this.config.enablePersistence && entry.accessCount > 1) {
        await this.saveToDisk(entry);
      }
      
      this.memoryCache.delete(key);
      this.updateAccessOrder(key, false);
      this.accessFrequency.delete(key);
      this.stats.evictionCount++;
    }
  }

  private shouldClear(key: string, entry: CacheEntry, pattern?: any): boolean {
    if (!pattern) return true;

    if (pattern.keyPattern) {
      const regex = new RegExp(pattern.keyPattern);
      if (!regex.test(key)) return false;
    }

    if (pattern.tags && pattern.tags.length > 0) {
      const hasMatchingTag = pattern.tags.some((tag: string) => 
        entry.metadata.tags?.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    if (pattern.sessionId && entry.metadata.sessionId !== pattern.sessionId) {
      return false;
    }

    if (pattern.userId && entry.metadata.userId !== pattern.userId) {
      return false;
    }

    if (pattern.olderThan && entry.timestamp > pattern.olderThan) {
      return false;
    }

    return true;
  }

  private updateStats(): void {
    this.stats.totalEntries = this.memoryCache.size;
    this.stats.totalSize = Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    this.stats.memoryUsage = this.stats.totalSize;

    // Calculate hit rate (simplified)
    const totalAccess = this.stats.hitRate + this.stats.missRate;
    this.stats.hitRate = totalAccess > 0 ? this.stats.hitRate / totalAccess : 0;
    this.stats.missRate = totalAccess > 0 ? this.stats.missRate / totalAccess : 0;

    // Update top keys
    this.stats.topKeys = Array.from(this.accessFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, accessCount]) => {
        const entry = this.memoryCache.get(key);
        return {
          key,
          accessCount,
          size: entry?.size || 0
        };
      });
  }

  private recordCacheHit(accessTime: number): void {
    this.stats.hitRate = (this.stats.hitRate * 0.9) + (1 * 0.1); // Moving average
    this.stats.averageAccessTime = (this.stats.averageAccessTime * 0.9) + (accessTime * 0.1);
  }

  private recordCacheMiss(accessTime: number): void {
    this.stats.missRate = (this.stats.missRate * 0.9) + (1 * 0.1); // Moving average
    this.stats.averageAccessTime = (this.stats.averageAccessTime * 0.9) + (accessTime * 0.1);
  }

  private async compressValue(value: any): Promise<any> {
    // Simplified compression - would use proper compression library
    return JSON.stringify(value);
  }

  private async encryptValue(value: any): Promise<any> {
    // Simplified encryption - would use proper encryption library
    return value;
  }

  private async cleanupExpired(): Promise<number> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.memoryCache) {
      if (now > entry.timestamp + entry.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.memoryCache.delete(key);
      this.updateAccessOrder(key, false);
    }

    return expiredKeys.length;
  }

  private async compressLargeEntries(): Promise<number> {
    let compressedCount = 0;
    
    for (const [key, entry] of this.memoryCache) {
      if (entry.size > this.config.compressionThreshold && !entry.metadata.compressed) {
        try {
          const compressedValue = await this.compressValue(entry.value);
          entry.value = compressedValue;
          entry.size = this.calculateSize(compressedValue);
          entry.metadata.compressed = true;
          compressedCount++;
        } catch (error) {
          console.error('Compression error:', error);
        }
      }
    }

    return compressedCount;
  }

  private optimizeAccessOrder(): void {
    // Remove duplicates and maintain order
    this.accessOrder = Array.from(new Set(this.accessOrder));
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpired();
      } catch (error) {
        console.error('Cleanup timer error:', error);
      }
    }, this.config.cleanupInterval);
  }

  // Disk persistence methods (simplified implementations)
  private async getFromDisk(key: string): Promise<CacheEntry | null> {
    if (!this.config.enablePersistence) return null;
    
    try {
      const { data, error } = await this.db.supabase
        .from('cache_entries')
        .select('*')
        .eq('key', key)
        .single();

      if (error || !data) return null;

      return {
        key: data.key,
        value: data.value,
        timestamp: new Date(data.timestamp).getTime(),
        ttl: data.ttl,
        accessCount: data.access_count || 0,
        size: data.size || 0,
        metadata: data.metadata || {}
      };
    } catch (error) {
      console.error('Disk cache read error:', error);
      return null;
    }
  }

  private async saveToDisk(entry: CacheEntry): Promise<void> {
    if (!this.config.enablePersistence) return;
    
    try {
      await this.db.supabase
        .from('cache_entries')
        .upsert({
          key: entry.key,
          value: entry.value,
          timestamp: new Date(entry.timestamp).toISOString(),
          ttl: entry.ttl,
          access_count: entry.accessCount,
          size: entry.size,
          metadata: entry.metadata
        });
    } catch (error) {
      console.error('Disk cache write error:', error);
    }
  }

  private async deleteFromDisk(key: string): Promise<boolean> {
    if (!this.config.enablePersistence) return false;
    
    try {
      const { error } = await this.db.supabase
        .from('cache_entries')
        .delete()
        .eq('key', key);

      return !error;
    } catch (error) {
      console.error('Disk cache delete error:', error);
      return false;
    }
  }

  private async clearFromDisk(pattern: any): Promise<number> {
    if (!this.config.enablePersistence) return 0;
    
    try {
      // Simplified disk cache clearing
      const { error } = await this.db.supabase
        .from('cache_entries')
        .delete()
        .lt('timestamp', new Date(pattern.olderThan || 0).toISOString());

      return error ? 0 : 1; // Simplified count
    } catch (error) {
      console.error('Disk cache clear error:', error);
      return 0;
    }
  }

  private async defragmentDiskCache(): Promise<void> {
    if (!this.config.enablePersistence) return;
    
    try {
      // Clean up expired entries from disk
      const expiredThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
      await this.db.supabase
        .from('cache_entries')
        .delete()
        .lt('timestamp', expiredThreshold.toISOString());
    } catch (error) {
      console.error('Disk cache defragmentation error:', error);
    }
  }

  /**
   * Cleanup method for proper shutdown
   */
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Persist important cache entries to disk
    if (this.config.enablePersistence) {
      const highPriorityEntries = Array.from(this.memoryCache.entries())
        .filter(([, entry]) => entry.metadata.priority === 'high');

      for (const [, entry] of highPriorityEntries) {
        await this.saveToDisk(entry);
      }
    }

    this.memoryCache.clear();
    this.accessOrder = [];
    this.accessFrequency.clear();
  }
}

// Singleton instance
export const cacheService = new CacheService({
  maxMemorySize: 50 * 1024 * 1024, // 50MB
  maxDiskSize: 500 * 1024 * 1024, // 500MB
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  enablePersistence: true,
  evictionPolicy: 'lru'
});