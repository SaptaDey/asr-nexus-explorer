/**
 * Database Migration Service
 * Handles applying and tracking database schema migrations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface Migration {
  version: string;
  name: string;
  sql: string;
  applied: boolean;
  appliedAt?: string;
}

export interface MigrationResult {
  version: string;
  success: boolean;
  error?: string;
  executionTime: number;
}

export class MigrationService {
  private supabase: SupabaseClient;

  constructor() {
    // Use the existing configured supabase client instead of creating a new one
    this.supabase = supabase;
  }

  /**
   * Check if schema_migrations table exists and create if not
   */
  private async ensureMigrationsTable(): Promise<void> {
    try {
      // CRITICAL FIX: Check authentication before attempting RPC calls
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (!user || authError) {
        console.log('🔄 MigrationService: Skipping migrations table setup for guest user (prevents 401 errors)');
        return;
      }

      const { error } = await this.supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            migrated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });

      if (error) {
        console.warn('Could not ensure migrations table (may not have RPC access):', error);
      }
    } catch (error) {
      console.warn('Migration table setup failed:', error);
    }
  }

  /**
   * Get list of applied migrations
   */
  async getAppliedMigrations(): Promise<string[]> {
    try {
      // CRITICAL FIX: Check authentication before attempting schema_migrations query
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (!user || authError) {
        console.log('🔄 MigrationService: Skipping migration history for guest user (prevents 401 errors)');
        return [];
      }

      await this.ensureMigrationsTable();

      const { data, error } = await this.supabase
        .from('schema_migrations')
        .select('version')
        .order('migrated_at', { ascending: true });

      if (error) {
        console.warn('Could not fetch migration history:', error);
        return [];
      }

      return data?.map(row => row.version) || [];
    } catch (error) {
      console.warn('Failed to get applied migrations:', error);
      return [];
    }
  }

  /**
   * Check database schema status
   */
  async checkSchemaStatus(): Promise<{
    tablesExist: { [tableName: string]: boolean };
    missingTables: string[];
    appliedMigrations: string[];
    recommendedActions: string[];
  }> {
    // CRITICAL FIX: Check authentication before attempting table queries
    const { data: { user }, error: authError } = await this.supabase.auth.getUser();
    
    if (!user || authError) {
      console.log('🔄 MigrationService: Skipping schema check for guest user (prevents 401 errors)');
      return {
        tablesExist: {},
        missingTables: [],
        appliedMigrations: [],
        recommendedActions: ['Authentication required for schema operations']
      };
    }

    const requiredTables = [
      'query_sessions',
      'graph_data', 
      'stage_executions',
      'hypotheses',
      'knowledge_gaps',
      'performance_metrics',
      'error_logs',
      'profiles'
    ];

    const tablesExist: { [tableName: string]: boolean } = {};
    const missingTables: string[] = [];
    const recommendedActions: string[] = [];

    // Check which tables exist (only for authenticated users)
    for (const tableName of requiredTables) {
      try {
        const { error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(0);

        tablesExist[tableName] = !error;
        
        if (error) {
          missingTables.push(tableName);
          if (error.message.includes('does not exist')) {
            recommendedActions.push(`Create table: ${tableName}`);
          }
        }
      } catch (err) {
        tablesExist[tableName] = false;
        missingTables.push(tableName);
      }
    }

    // Get applied migrations
    const appliedMigrations = await this.getAppliedMigrations();

    // Check for specific migration recommendations
    if (missingTables.length > 0) {
      recommendedActions.push('Apply comprehensive schema alignment migration');
    }

    if (!tablesExist['graph_data'] && tablesExist['query_sessions']) {
      recommendedActions.push('Create graph_data table for better graph storage');
    }

    if (!tablesExist['stage_executions']) {
      recommendedActions.push('Create stage_executions table for pipeline tracking');
    }

    return {
      tablesExist,
      missingTables,
      appliedMigrations,
      recommendedActions
    };
  }

  /**
   * Apply a migration via SQL execution
   */
  async applyMigration(migration: Migration): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      // CRITICAL FIX: Check authentication before attempting migration
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (!user || authError) {
        console.log('🔄 MigrationService: Skipping migration for guest user (prevents 401 errors)');
        return {
          version: migration.version,
          success: false,
          error: 'Authentication required for migrations',
          executionTime: Date.now() - startTime
        };
      }

      console.log(`🔄 Applying migration: ${migration.name}`);

      // Try to execute the migration SQL
      // Note: This requires appropriate RPC function or direct SQL execution capability
      const { error } = await this.supabase.rpc('exec_sql', {
        sql: migration.sql
      });

      if (error) {
        throw new Error(error.message);
      }

      // Record the migration as applied
      await this.recordMigration(migration.version);

      const executionTime = Date.now() - startTime;
      console.log(`✅ Migration applied successfully: ${migration.name} (${executionTime}ms)`);

      return {
        version: migration.version,
        success: true,
        executionTime
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Migration failed: ${migration.name}`, error);

      return {
        version: migration.version,
        success: false,
        error: error.message || 'Unknown migration error',
        executionTime
      };
    }
  }

  /**
   * Record a migration as applied
   */
  private async recordMigration(version: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('schema_migrations')
        .upsert({ 
          version, 
          migrated_at: new Date().toISOString() 
        });

      if (error) {
        console.warn('Could not record migration:', error);
      }
    } catch (error) {
      console.warn('Failed to record migration:', error);
    }
  }

  /**
   * Validate current schema against expected schema
   */
  async validateSchema(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const status = await this.checkSchemaStatus();

      // Check for missing required tables
      if (status.missingTables.length > 0) {
        issues.push(`Missing tables: ${status.missingTables.join(', ')}`);
        recommendations.push('Apply schema alignment migration to create missing tables');
      }

      // Check for specific critical tables
      if (!status.tablesExist['query_sessions']) {
        issues.push('Core query_sessions table is missing');
        recommendations.push('This is a critical issue - the application cannot function without this table');
      }

      if (!status.tablesExist['graph_data']) {
        issues.push('Graph data storage table is missing');
        recommendations.push('Create graph_data table for proper graph persistence');
      }

      // Check migration history
      if (status.appliedMigrations.length === 0) {
        issues.push('No migration history found');
        recommendations.push('Initialize migration tracking system');
      }

      const isValid = issues.length === 0;

      return {
        isValid,
        issues,
        recommendations
      };

    } catch (error) {
      return {
        isValid: false,
        issues: [`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Check database connectivity and permissions']
      };
    }
  }

  /**
   * Initialize or repair database schema
   */
  async initializeSchema(): Promise<{
    success: boolean;
    tablesCreated: string[];
    errors: string[];
  }> {
    const tablesCreated: string[] = [];
    const errors: string[] = [];

    try {
      console.log('🔧 Initializing database schema...');

      // Ensure migrations table exists
      await this.ensureMigrationsTable();

      // Apply the comprehensive schema alignment migration
      const alignmentMigration: Migration = {
        version: '999_comprehensive_schema_alignment',
        name: 'Comprehensive Schema Alignment',
        sql: await this.loadMigrationSQL('999_comprehensive_schema_alignment'),
        applied: false
      };

      const result = await this.applyMigration(alignmentMigration);
      
      if (result.success) {
        tablesCreated.push('schema alignment applied');
      } else {
        errors.push(`Schema alignment failed: ${result.error}`);
      }

      // Validate the result
      const validation = await this.validateSchema();
      
      if (!validation.isValid) {
        errors.push(...validation.issues);
      }

      return {
        success: errors.length === 0,
        tablesCreated,
        errors
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      
      return {
        success: false,
        tablesCreated,
        errors
      };
    }
  }

  /**
   * Load migration SQL from file (placeholder - would need actual file loading)
   */
  private async loadMigrationSQL(migrationName: string): Promise<string> {
    // In a real implementation, this would load from the migrations directory
    // For now, return the comprehensive schema alignment SQL
    return `
      -- Comprehensive Schema Alignment SQL would be loaded here
      -- This is a placeholder that would contain the actual migration content
      SELECT 'Migration placeholder' as status;
    `;
  }

  /**
   * Get schema health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    message: string;
    details: {
      tablesExist: number;
      totalTables: number;
      missingTables: string[];
      appliedMigrations: number;
    };
  }> {
    try {
      const schemaStatus = await this.checkSchemaStatus();
      const validation = await this.validateSchema();

      const totalTables = Object.keys(schemaStatus.tablesExist).length;
      const existingTables = Object.values(schemaStatus.tablesExist).filter(exists => exists).length;

      let status: 'healthy' | 'degraded' | 'critical';
      let message: string;

      if (validation.isValid) {
        status = 'healthy';
        message = 'Database schema is properly configured';
      } else if (existingTables / totalTables >= 0.7) {
        status = 'degraded';
        message = 'Database schema has some issues but is mostly functional';
      } else {
        status = 'critical';
        message = 'Database schema has critical issues';
      }

      return {
        status,
        message,
        details: {
          tablesExist: existingTables,
          totalTables,
          missingTables: schemaStatus.missingTables,
          appliedMigrations: schemaStatus.appliedMigrations.length
        }
      };

    } catch (error) {
      return {
        status: 'critical',
        message: `Schema health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          tablesExist: 0,
          totalTables: 0,
          missingTables: [],
          appliedMigrations: 0
        }
      };
    }
  }
}

// Singleton instance
export const migrationService = new MigrationService();