/**
 * Backend Initialization Service
 * Ensures all Supabase storage buckets and real-time channels are properly configured
 */

import { supabase } from '@/integrations/supabase/client';

export interface BackendHealthStatus {
  database: 'connected' | 'error';
  realtime: 'connected' | 'error';
  storage: 'connected' | 'error';
  buckets: {
    'asr-got-analyses': boolean;
    'asr-got-visualizations': boolean;
    'query-figures': boolean;
  };
  errors: string[];
}

export class BackendInitializer {
  private static instance: BackendInitializer;
  private isInitialized = false;
  private healthStatus: BackendHealthStatus = {
    database: 'error',
    realtime: 'error', 
    storage: 'error',
    buckets: {
      'asr-got-analyses': false,
      'asr-got-visualizations': false,
      'query-figures': false
    },
    errors: []
  };

  public static getInstance(): BackendInitializer {
    if (!BackendInitializer.instance) {
      BackendInitializer.instance = new BackendInitializer();
    }
    return BackendInitializer.instance;
  }

  /**
   * Full backend initialization - call this on app start
   */
  async initializeBackend(): Promise<BackendHealthStatus> {
    console.log('🚀 Initializing ASR-GoT Backend Services...');
    this.healthStatus.errors = [];

    try {
      // Database health check with timeout
      await this.checkDatabaseHealth();

      // Storage health check with timeout  
      await this.checkStorageHealth();

      // Realtime health check with timeout
      await this.checkRealtimeHealth();

      this.isInitialized = true;
      console.log('✅ Backend initialization completed successfully');

    } catch (error) {
      console.error('❌ Backend initialization error:', error);
      this.healthStatus.errors.push(`Initialization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return this.healthStatus;
  }

  /**
   * Check database connectivity with timeout
   */
  private async checkDatabaseHealth(): Promise<void> {
    try {
      console.log('🔍 Checking database connectivity...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database check timeout after 5 seconds')), 5000);
      });

      const healthCheck = supabase.from('asr_got_analyses').select('count', { count: 'exact', head: true });
      
      await Promise.race([healthCheck, timeoutPromise]);
      
      this.healthStatus.database = 'connected';
      console.log('✅ Database connection successful');
      
    } catch (error) {
      console.warn('⚠️ Database check failed:', error);
      this.healthStatus.database = 'error';
      this.healthStatus.errors.push(`Database: ${error instanceof Error ? error.message : 'Connection failed'}`);
    }
  }

  /**
   * Check storage connectivity with timeout
   */
  private async checkStorageHealth(): Promise<void> {
    try {
      console.log('🗄️ Checking storage connectivity...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Storage check timeout after 5 seconds')), 5000);
      });

      const bucketCheck = supabase.storage.listBuckets();
      
      const { data: buckets, error } = await Promise.race([bucketCheck, timeoutPromise]) as any;
      
      if (error) throw error;

      this.healthStatus.storage = 'connected';
      
      // Check individual buckets
      if (buckets) {
        this.healthStatus.buckets['asr-got-analyses'] = buckets.some((b: any) => b.name === 'asr-got-analyses');
        this.healthStatus.buckets['asr-got-visualizations'] = buckets.some((b: any) => b.name === 'asr-got-visualizations');
        this.healthStatus.buckets['query-figures'] = buckets.some((b: any) => b.name === 'query-figures');
      }
      
      console.log('✅ Storage connection successful');
      
    } catch (error) {
      console.warn('⚠️ Storage check failed:', error);
      this.healthStatus.storage = 'error';
      this.healthStatus.errors.push(`Storage: ${error instanceof Error ? error.message : 'Connection failed'}`);
    }
  }

  /**
   * Check realtime connectivity with timeout
   */
  private async checkRealtimeHealth(): Promise<void> {
    try {
      console.log('🔗 Checking realtime connectivity...');
      
      // Simple realtime check with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Realtime check timeout after 3 seconds')), 3000);
      });

      const channel = supabase.channel('health-check');
      const subscribePromise = new Promise((resolve) => {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            resolve(true);
          }
        });
      });

      await Promise.race([subscribePromise, timeoutPromise]);
      
      channel.unsubscribe();
      
      this.healthStatus.realtime = 'connected';
      console.log('✅ Realtime connection successful');
      
    } catch (error) {
      console.warn('⚠️ Realtime check failed:', error);
      this.healthStatus.realtime = 'error';
      this.healthStatus.errors.push(`Realtime: ${error instanceof Error ? error.message : 'Connection failed'}`);
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): BackendHealthStatus {
    return this.healthStatus;
  }

  /**
   * Quick health check (for periodic monitoring)
   */
  async quickHealthCheck(): Promise<BackendHealthStatus> {
    if (!this.isInitialized) {
      return await this.initializeBackend();
    }
    return this.healthStatus;
  }

  /**
   * Check if backend is fully initialized and healthy
   */
  isHealthy(): boolean {
    return this.isInitialized && 
           this.healthStatus.database === 'connected' &&
           this.healthStatus.storage === 'connected' &&
           this.healthStatus.realtime === 'connected';
  }

  /**
   * Force re-initialization
   */
  async reinitialize(): Promise<BackendHealthStatus> {
    this.isInitialized = false;
    return await this.initializeBackend();
  }

  /**
   * Reset initialization state (for testing)
   */
  reset(): void {
    this.isInitialized = false;
    this.healthStatus = {
      database: 'error',
      realtime: 'error',
      storage: 'error',
      buckets: {
        'asr-got-analyses': false,
        'asr-got-visualizations': false,
        'query-figures': false
      },
      errors: []
    };
  }
}

export const backendInitializer = BackendInitializer.getInstance();