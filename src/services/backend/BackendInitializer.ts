/**
 * Backend Initialization Service
 * Ensures all Supabase storage buckets and real-time channels are properly configured
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      // Step 1: Test database connection
      await this.testDatabaseConnection();
      
      // Step 2: Initialize storage buckets
      await this.initializeStorageBuckets();
      
      // Step 3: Test real-time connection
      await this.testRealtimeConnection();

      // Step 4: Validate required tables exist
      await this.validateDatabaseTables();

      this.isInitialized = true;
      console.log('✅ Backend initialization completed successfully');
      
      if (this.healthStatus.errors.length === 0) {
        toast.success('Backend connected successfully');
      } else {
        toast.warning(`Backend connected with ${this.healthStatus.errors.length} warnings`);
      }

      return this.healthStatus;
    } catch (error) {
      console.error('❌ Backend initialization failed:', error);
      this.healthStatus.errors.push(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Backend initialization failed. Some features may not work.');
      return this.healthStatus;
    }
  }

  /**
   * Test database connectivity
   */
  private async testDatabaseConnection(): Promise<void> {
    try {
      console.log('🔍 Testing database connection...');
      
      const { error } = await supabase
        .from('research_sessions')
        .select('id')
        .limit(1);

      if (error) throw error;
      
      this.healthStatus.database = 'connected';
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      this.healthStatus.database = 'error';
      this.healthStatus.errors.push(`Database: ${error instanceof Error ? error.message : 'Connection failed'}`);
      throw error;
    }
  }

  /**
   * Initialize all required storage buckets
   */
  private async initializeStorageBuckets(): Promise<void> {
    console.log('🗄️ Initializing storage buckets...');

    const bucketsToCreate = [
      {
        name: 'asr-got-analyses',
        options: {
          public: false,
          allowedMimeTypes: ['application/json', 'text/html', 'text/plain'],
          fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
        }
      },
      {
        name: 'asr-got-visualizations', 
        options: {
          public: true,
          allowedMimeTypes: ['image/png', 'image/svg+xml', 'application/pdf'],
          fileSizeLimit: 10 * 1024 * 1024 // 10MB per file
        }
      },
      {
        name: 'query-figures',
        options: {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
          fileSizeLimit: 5 * 1024 * 1024 // 5MB per file
        }
      }
    ];

    try {
      // First, list existing buckets with better error handling
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
      
      let existingBucketNames = new Set<string>();
      
      if (listError) {
        console.warn('⚠️ Could not list existing buckets:', listError);
        this.healthStatus.storage = 'error';
        this.healthStatus.errors.push(`Storage list error: ${listError.message}`);
        
        // If we can't list buckets due to RLS, assume storage exists but with limited access
        if (listError.message.includes('RLS') || listError.message.includes('policy')) {
          console.log('🔓 Storage access limited by RLS policies - continuing with bucket validation');
          this.healthStatus.storage = 'connected';
        }
      } else {
        this.healthStatus.storage = 'connected';
        // Safely map bucket names with null checks
        if (existingBuckets && Array.isArray(existingBuckets) && existingBuckets.length > 0) {
          existingBucketNames = new Set(existingBuckets.map(b => b?.name).filter(Boolean));
        }
      }

      // Create missing buckets with enhanced error handling
      for (const bucket of bucketsToCreate) {
        if (existingBucketNames.has(bucket.name)) {
          console.log(`✅ Storage bucket '${bucket.name}' already exists`);
          this.healthStatus.buckets[bucket.name as keyof typeof this.healthStatus.buckets] = true;
        } else {
          try {
            console.log(`🔧 Attempting to create storage bucket: ${bucket.name}`);
            
            const { data, error } = await supabase.storage.createBucket(bucket.name, bucket.options);
            
            if (error) {
              // Handle different types of errors
              if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                console.log(`✅ Storage bucket '${bucket.name}' already exists (duplicate error)`);
                this.healthStatus.buckets[bucket.name as keyof typeof this.healthStatus.buckets] = true;
              } else if (error.message.includes('RLS') || error.message.includes('policy')) {
                // RLS policy prevents bucket creation - try to verify if bucket exists by other means
                console.warn(`🔓 RLS policy prevents creating bucket '${bucket.name}' - assuming it exists`);
                this.healthStatus.buckets[bucket.name as keyof typeof this.healthStatus.buckets] = true;
                this.healthStatus.errors.push(`Bucket ${bucket.name}: Limited access due to RLS policy (assuming exists)`);
              } else {
                throw error;
              }
            } else {
              console.log(`✅ Storage bucket '${bucket.name}' created successfully`);
              this.healthStatus.buckets[bucket.name as keyof typeof this.healthStatus.buckets] = true;
            }
          } catch (bucketError) {
            console.error(`❌ Failed to create bucket '${bucket.name}':`, bucketError);
            
            // For RLS errors, assume bucket exists but mark as limited access
            if (bucketError instanceof Error && (bucketError.message.includes('RLS') || bucketError.message.includes('policy'))) {
              console.log(`🔓 Assuming bucket '${bucket.name}' exists despite RLS restrictions`);
              this.healthStatus.buckets[bucket.name as keyof typeof this.healthStatus.buckets] = true;
              this.healthStatus.errors.push(`Bucket ${bucket.name}: RLS policy restriction - limited access`);
            } else {
              this.healthStatus.errors.push(`Bucket ${bucket.name}: ${bucketError instanceof Error ? bucketError.message : 'Creation failed'}`);
              this.healthStatus.buckets[bucket.name as keyof typeof this.healthStatus.buckets] = false;
            }
          }
        }
      }

      console.log('✅ Storage bucket initialization completed');
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      this.healthStatus.storage = 'error';
      this.healthStatus.errors.push(`Storage: ${error instanceof Error ? error.message : 'Initialization failed'}`);
    }
  }

  /**
   * Test real-time connection
   */
  private async testRealtimeConnection(): Promise<void> {
    try {
      console.log('🔗 Testing real-time connection...');
      
      const channel = supabase.channel('test-connection');
      
      const connectionPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          channel.unsubscribe();
          reject(new Error('Real-time connection timeout'));
        }, 10000); // 10 second timeout

        channel
          .on('broadcast', { event: 'test' }, () => {
            // Test event received
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              channel.unsubscribe();
              resolve();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              clearTimeout(timeout);
              channel.unsubscribe();
              reject(new Error(`Real-time connection failed: ${status}`));
            }
          });
      });

      await connectionPromise;
      
      this.healthStatus.realtime = 'connected';
      console.log('✅ Real-time connection successful');
    } catch (error) {
      console.error('❌ Real-time connection failed:', error);
      this.healthStatus.realtime = 'error';
      this.healthStatus.errors.push(`Real-time: ${error instanceof Error ? error.message : 'Connection failed'}`);
    }
  }

  /**
   * Validate that all required database tables exist
   */
  private async validateDatabaseTables(): Promise<void> {
    console.log('📊 Validating database tables...');
    
    const requiredTables = [
      'research_sessions',
      'query_sessions', 
      'query_figures',
      'query_tables',
      'stage_executions',
      'graph_data',
      'profiles'
    ];

    const missingTables: string[] = [];

    for (const table of requiredTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
          missingTables.push(table);
        }
      } catch (error) {
        console.warn(`⚠️ Could not validate table '${table}':`, error);
        this.healthStatus.errors.push(`Table validation ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (missingTables.length > 0) {
      const errorMsg = `Missing database tables: ${missingTables.join(', ')}`;
      console.error(`❌ ${errorMsg}`);
      this.healthStatus.errors.push(errorMsg);
    } else {
      console.log('✅ All required database tables validated');
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): BackendHealthStatus {
    return { ...this.healthStatus };
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
}

// Export singleton instance
export const backendInitializer = BackendInitializer.getInstance();