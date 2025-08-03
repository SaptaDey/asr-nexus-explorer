/**
 * Comprehensive Backend Service
 * Main orchestration service for all backend operations
 */

import { backendInitializer, type BackendHealthStatus } from './BackendInitializer';
import { storageManager } from './StorageManager';
import { historyManager } from './HistoryManager';
import { webSocketService } from '../WebSocketService';
import { supabaseStorage } from '../SupabaseStorageService';
import { queryHistoryService } from '../QueryHistoryService';
import { supabase } from '@/integrations/supabase/client';

export interface BackendServiceStatus {
  initialized: boolean;
  health: BackendHealthStatus;
  services: {
    storage: boolean;
    history: boolean;
    realtime: boolean;
    queryHistory: boolean;
    supabaseStorage: boolean;
  };
  lastCheck: string;
}

export class BackendService {
  private static instance: BackendService;
  private isInitialized = false;
  private status: BackendServiceStatus = {
    initialized: false,
    health: {
      database: 'error',
      realtime: 'error',
      storage: 'error',
      buckets: {
        'asr-got-analyses': false,
        'asr-got-visualizations': false,
        'query-figures': false
      },
      errors: []
    },
    services: {
      storage: false,
      history: false,
      realtime: false,
      queryHistory: false,
      supabaseStorage: false
    },
    lastCheck: new Date().toISOString()
  };

  public static getInstance(): BackendService {
    if (!BackendService.instance) {
      BackendService.instance = new BackendService();
    }
    return BackendService.instance;
  }

  /**
   * Initialize all backend services (singleton pattern - only once)
   */
  async initialize(): Promise<BackendServiceStatus> {
    // Prevent repeated initialization
    if (this.isInitialized) {
      console.log('🔄 Backend service already initialized, returning cached status');
      return this.status;
    }

    console.log('🚀 Initializing ASR-GoT Backend Service...');

    try {
      // Step 1: Initialize core backend (database, storage, realtime)
      console.log('📡 Initializing core backend...');
      this.status.health = await backendInitializer.initializeBackend();

      // Step 2: Initialize storage services
      console.log('🗄️ Initializing storage services...');
      await this.initializeStorageServices();

      // Step 3: Initialize history services
      console.log('📚 Initializing history services...');
      await this.initializeHistoryServices();

      // Step 4: Initialize realtime services
      console.log('🔗 Initializing realtime services...');
      await this.initializeRealtimeServices();

      this.isInitialized = true;
      this.status.initialized = true;
      this.status.lastCheck = new Date().toISOString();

      console.log('✅ Backend service initialization completed');
      console.log('📊 Backend Status:', this.getStatusSummary());

      return this.status;

    } catch (error) {
      console.error('❌ Backend service initialization failed:', error);
      this.status.health.errors.push(`Service initialization: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return this.status;
    }
  }

  /**
   * Initialize storage services
   */
  private async initializeStorageServices(): Promise<void> {
    try {
      // Check auth before testing storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🔄 Skipping storage test - no authenticated user');
        this.status.services.storage = false;
        this.status.services.supabaseStorage = false;
        return;
      }

      // Test storage manager
      const testResult = await storageManager.listFiles('asr-got-analyses');
      this.status.services.storage = testResult.success;

      // Initialize Supabase storage service
      try {
        await supabaseStorage.initializeStorage();
        this.status.services.supabaseStorage = true;
      } catch (error) {
        console.warn('⚠️ Supabase storage service initialization warning:', error);
        this.status.services.supabaseStorage = false;
      }

      console.log(`✅ Storage services initialized (Storage: ${this.status.services.storage}, SupabaseStorage: ${this.status.services.supabaseStorage})`);
    } catch (error) {
      console.error('❌ Storage services initialization failed:', error);
      this.status.services.storage = false;
      this.status.services.supabaseStorage = false;
    }
  }

  /**
   * Initialize history services
   */
  private async initializeHistoryServices(): Promise<void> {
    try {
      // Check auth before testing history services
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🔄 Skipping history tests - no authenticated user');
        this.status.services.history = false;
        this.status.services.queryHistory = false;
        return;
      }

      // Test history manager
      const testResult = await historyManager.getSessions({ limit: 1 });
      this.status.services.history = testResult.sessions.length >= 0; // Success if no error

      // Test query history service
      try {
        const queryTestResult = await queryHistoryService.getQueryHistory(1, 0);
        this.status.services.queryHistory = queryTestResult.sessions.length >= 0;
      } catch (error) {
        console.warn('⚠️ Query history service test failed:', error);
        this.status.services.queryHistory = false;
      }

      console.log(`✅ History services initialized (History: ${this.status.services.history}, QueryHistory: ${this.status.services.queryHistory})`);
    } catch (error) {
      console.error('❌ History services initialization failed:', error);
      this.status.services.history = false;
      this.status.services.queryHistory = false;
    }
  }

  /**
   * Initialize realtime services
   */
  private async initializeRealtimeServices(): Promise<void> {
    try {
      // Check auth before testing realtime services
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🔄 Skipping realtime test - no authenticated user (emergency mode)');
        this.status.services.realtime = false;
        return;
      }

      // Test realtime service
      const isConnected = webSocketService.isConnected();
      this.status.services.realtime = isConnected;

      if (!isConnected) {
        console.log('🔄 Attempting to connect WebSocket service...');
        webSocketService.connect();
        
        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.status.services.realtime = webSocketService.isConnected();
      }

      console.log(`✅ Realtime services initialized (Connected: ${this.status.services.realtime})`);
    } catch (error) {
      console.error('❌ Realtime services initialization failed:', error);
      this.status.services.realtime = false;
    }
  }

  /**
   * Get current status
   */
  getStatus(): BackendServiceStatus {
    this.status.lastCheck = new Date().toISOString();
    return { ...this.status };
  }

  /**
   * Get status summary
   */
  getStatusSummary(): {
    healthy: boolean;
    servicesOnline: number;
    totalServices: number;
    errors: number;
  } {
    const serviceStatuses = Object.values(this.status.services);
    const servicesOnline = serviceStatuses.filter(s => s).length;
    const totalServices = serviceStatuses.length;
    
    return {
      healthy: this.isHealthy(),
      servicesOnline,
      totalServices,
      errors: this.status.health.errors.length
    };
  }

  /**
   * Check if backend is healthy
   */
  isHealthy(): boolean {
    const coreHealthy = backendInitializer.isHealthy();
    const criticalServicesOnline = this.status.services.storage && this.status.services.history;
    
    return this.isInitialized && coreHealthy && criticalServicesOnline;
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<BackendServiceStatus> {
    console.log('🔍 Performing backend health check...');

    try {
      // Re-check backend health
      this.status.health = backendInitializer.getHealthStatus();

      // Re-test services
      await Promise.all([
        this.testStorageHealth(),
        this.testHistoryHealth(),
        this.testRealtimeHealth()
      ]);

      this.status.lastCheck = new Date().toISOString();
      
      const summary = this.getStatusSummary();
      console.log(`📊 Health check completed: ${summary.servicesOnline}/${summary.totalServices} services online, ${summary.errors} errors`);

      return this.status;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return this.status;
    }
  }

  /**
   * Test storage health
   */
  private async testStorageHealth(): Promise<void> {
    try {
      const result = await storageManager.listFiles('asr-got-analyses');
      this.status.services.storage = result.success;
    } catch (error) {
      this.status.services.storage = false;
    }
  }

  /**
   * Test history health
   */
  private async testHistoryHealth(): Promise<void> {
    try {
      const result = await historyManager.getSessions({ limit: 1 });
      this.status.services.history = true;
    } catch (error) {
      this.status.services.history = false;
    }
  }

  /**
   * Test realtime health
   */
  private async testRealtimeHealth(): Promise<void> {
    this.status.services.realtime = webSocketService.isConnected();
  }

  /**
   * Force reinitialize all services
   */
  async reinitialize(): Promise<BackendServiceStatus> {
    console.log('🔄 Reinitializing backend services...');
    
    this.isInitialized = false;
    this.status.initialized = false;
    this.status.services = {
      storage: false,
      history: false,
      realtime: false,
      queryHistory: false,
      supabaseStorage: false
    };

    return await this.initialize();
  }

  /**
   * Create a new research session (convenience method)
   */
  async createSession(title: string, description?: string, researchContext?: any): Promise<string | null> {
    if (!this.status.services.history) {
      console.error('❌ Cannot create session: history service not available');
      return null;
    }

    return await historyManager.createSession(title, description, researchContext);
  }

  /**
   * Get session history (convenience method)
   */
  async getSessionHistory(options: any = {}): Promise<any> {
    if (!this.status.services.history) {
      console.error('❌ Cannot get session history: history service not available');
      return { sessions: [], total: 0 };
    }

    return await historyManager.getSessions(options);
  }

  /**
   * Upload file to storage (convenience method)
   */
  async uploadFile(bucketName: string, filePath: string, file: any, options: any = {}): Promise<any> {
    if (!this.status.services.storage) {
      console.error('❌ Cannot upload file: storage service not available');
      return { success: false, error: 'Storage service not available' };
    }

    return await storageManager.uploadFile(bucketName, filePath, file, options);
  }

  /**
   * Join realtime session (convenience method)
   */
  joinRealtimeSession(sessionId: string): void {
    if (!this.status.services.realtime) {
      console.warn('⚠️ Cannot join realtime session: realtime service not available');
      return;
    }

    webSocketService.joinSession(sessionId);
  }

  /**
   * Get error summary for debugging
   */
  getErrors(): string[] {
    return [...this.status.health.errors];
  }

  /**
   * Clear errors
   */
  clearErrors(): void {
    this.status.health.errors = [];
  }
}

// Export singleton instance
export const backendService = BackendService.getInstance();

// Auto-initialize on module load (can be disabled if needed)
let autoInitPromise: Promise<BackendServiceStatus> | null = null;

export const initializeBackendOnLoad = () => {
  if (!autoInitPromise) {
    autoInitPromise = backendService.initialize();
  }
  return autoInitPromise;
};

// Call auto-initialization
if (typeof window !== 'undefined') {
  // Only auto-initialize in browser environment
  setTimeout(() => {
    initializeBackendOnLoad().catch(error => {
      console.error('❌ Auto-initialization failed:', error);
    });
  }, 1000); // Small delay to ensure DOM is ready
}