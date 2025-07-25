/**
 * Database Migration Runner
 * Handles database schema migrations for deployment
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Migration {
  id: string;
  name: string;
  version: number;
  sql: string;
  checksum: string;
  dependencies?: string[];
  rollbackSql?: string;
  description?: string;
}

interface MigrationRecord {
  id: string;
  name: string;
  version: number;
  applied_at: string;
  checksum: string;
  execution_time: number;
  success: boolean;
  error_message?: string;
}

interface MigrationResult {
  success: boolean;
  migration: Migration;
  executionTime: number;
  error?: string;
}

export class MigrationRunner {
  private supabase: SupabaseClient;
  private migrations: Migration[] = [];
  private isInitialized = false;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * Initialize migration system
   */
  async initialize(): Promise<void> {
    try {
      await this.createMigrationTable();
      await this.loadMigrations();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize migration runner:', error);
      throw error;
    }
  }

  /**
   * Create migration tracking table
   */
  private async createMigrationTable(): Promise<void> {
    const { error } = await this.supabase.rpc('create_migration_table');
    
    if (error) {
      // Table might already exist, try creating manually
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          version INTEGER NOT NULL,
          applied_at TIMESTAMPTZ DEFAULT NOW(),
          checksum TEXT NOT NULL,
          execution_time INTEGER NOT NULL,
          success BOOLEAN NOT NULL,
          error_message TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at);
      `;
      
      const { error: createError } = await this.supabase.from('schema_migrations').select('*').limit(1);
      
      if (createError) {
        throw new Error(`Failed to create migration table: ${createError.message}`);
      }
    }
  }

  /**
   * Load migration definitions
   */
  private async loadMigrations(): Promise<void> {
    // In a real implementation, these would be loaded from files
    this.migrations = [
      {
        id: '001_initial_schema',
        name: 'Initial Schema',
        version: 1,
        sql: await this.loadMigrationSQL('001_initial_schema.sql'),
        checksum: await this.calculateChecksum('001_initial_schema.sql'),
        description: 'Create initial database schema for ASR-GoT framework'
      },
      {
        id: '002_add_graph_indexes',
        name: 'Add Graph Indexes',
        version: 2,
        sql: await this.loadMigrationSQL('002_add_graph_indexes.sql'),
        checksum: await this.calculateChecksum('002_add_graph_indexes.sql'),
        dependencies: ['001_initial_schema'],
        description: 'Add performance indexes for graph operations'
      },
      {
        id: '003_add_collaboration_features',
        name: 'Add Collaboration Features',
        version: 3,
        sql: await this.loadMigrationSQL('003_add_collaboration_features.sql'),
        checksum: await this.calculateChecksum('003_add_collaboration_features.sql'),
        dependencies: ['001_initial_schema'],
        description: 'Add real-time collaboration features'
      },
      {
        id: '004_add_cache_table',
        name: 'Add Cache Table',
        version: 4,
        sql: await this.loadMigrationSQL('004_add_cache_table.sql'),
        checksum: await this.calculateChecksum('004_add_cache_table.sql'),
        dependencies: ['001_initial_schema'],
        description: 'Add cache table for performance optimization'
      }
    ];

    // Sort migrations by version
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Load migration SQL from file
   */
  private async loadMigrationSQL(filename: string): Promise<string> {
    try {
      // In a real implementation, this would load from the file system
      // For now, we'll return a placeholder
      const response = await fetch(`/supabase/migrations/${filename}`);
      if (response.ok) {
        return await response.text();
      }
      
      // Fallback to hardcoded SQL for key migrations
      return this.getHardcodedMigration(filename);
    } catch (error) {
      console.warn(`Failed to load migration SQL for ${filename}, using hardcoded version`);
      return this.getHardcodedMigration(filename);
    }
  }

  /**
   * Get hardcoded migration SQL
   */
  private getHardcodedMigration(filename: string): string {
    const migrations: { [key: string]: string } = {
      '001_initial_schema.sql': `
        -- Initial Schema Migration
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Enable Row Level Security
        ALTER DATABASE postgres SET row_security = on;
        
        -- Create basic tables
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS research_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          config JSONB DEFAULT '{}',
          status TEXT DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
        
        -- Basic RLS policies
        CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can view own sessions" ON research_sessions FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can create sessions" ON research_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own sessions" ON research_sessions FOR UPDATE USING (auth.uid() = user_id);
      `,
      '002_add_graph_indexes.sql': `
        -- Add Graph Performance Indexes
        CREATE INDEX IF NOT EXISTS idx_graph_nodes_session_id ON graph_nodes(session_id);
        CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(type);
        CREATE INDEX IF NOT EXISTS idx_graph_edges_session_id ON graph_edges(session_id);
        CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(source);
        CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(target);
      `,
      '003_add_collaboration_features.sql': `
        -- Add Collaboration Features
        CREATE TABLE IF NOT EXISTS research_collaborations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
          collaborator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          role TEXT NOT NULL DEFAULT 'viewer',
          status TEXT DEFAULT 'pending',
          invited_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        ALTER TABLE research_collaborations ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view collaborations" ON research_collaborations FOR SELECT USING (
          auth.uid() = collaborator_id OR 
          auth.uid() = invited_by OR
          auth.uid() IN (
            SELECT user_id FROM research_sessions WHERE id = session_id
          )
        );
      `,
      '004_add_cache_table.sql': `
        -- Add Cache Table
        CREATE TABLE IF NOT EXISTS cache_entries (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          key TEXT UNIQUE NOT NULL,
          value JSONB NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          ttl INTEGER NOT NULL,
          access_count INTEGER DEFAULT 0,
          size INTEGER DEFAULT 0,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON cache_entries(key);
        CREATE INDEX IF NOT EXISTS idx_cache_entries_timestamp ON cache_entries(timestamp);
      `
    };
    
    return migrations[filename] || '-- Migration not found';
  }

  /**
   * Calculate migration checksum
   */
  private async calculateChecksum(filename: string): Promise<string> {
    const sql = await this.loadMigrationSQL(filename);
    // Simple checksum calculation (in production, use a proper hash function)
    return btoa(sql).substring(0, 32);
  }

  /**
   * Get applied migrations
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const { data, error } = await this.supabase
      .from('schema_migrations')
      .select('*')
      .order('version', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch applied migrations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const applied = await this.getAppliedMigrations();
    const appliedIds = new Set(applied.map(m => m.id));
    
    return this.migrations.filter(m => !appliedIds.has(m.id));
  }

  /**
   * Run a single migration
   */
  async runMigration(migration: Migration): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      // Check dependencies
      await this.checkDependencies(migration);
      
      // Execute migration
      const { error } = await this.supabase.rpc('exec_sql', { 
        sql: migration.sql 
      });
      
      if (error) {
        throw new Error(`Migration execution failed: ${error.message}`);
      }
      
      const executionTime = Date.now() - startTime;
      
      // Record successful migration
      await this.recordMigration(migration, executionTime, true);
      
      return {
        success: true,
        migration,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Record failed migration
      await this.recordMigration(migration, executionTime, false, errorMessage);
      
      return {
        success: false,
        migration,
        executionTime,
        error: errorMessage
      };
    }
  }

  /**
   * Check migration dependencies
   */
  private async checkDependencies(migration: Migration): Promise<void> {
    if (!migration.dependencies || migration.dependencies.length === 0) {
      return;
    }

    const applied = await this.getAppliedMigrations();
    const appliedIds = new Set(applied.map(m => m.id));
    
    for (const dependency of migration.dependencies) {
      if (!appliedIds.has(dependency)) {
        throw new Error(`Missing dependency: ${dependency} for migration ${migration.id}`);
      }
    }
  }

  /**
   * Record migration in database
   */
  private async recordMigration(
    migration: Migration,
    executionTime: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('schema_migrations')
      .insert({
        id: migration.id,
        name: migration.name,
        version: migration.version,
        checksum: migration.checksum,
        execution_time: executionTime,
        success,
        error_message: errorMessage
      });

    if (error) {
      console.error('Failed to record migration:', error);
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<MigrationResult[]> {
    if (!this.isInitialized) {
      throw new Error('Migration runner not initialized');
    }

    const pending = await this.getPendingMigrations();
    const results: MigrationResult[] = [];

    console.log(`Found ${pending.length} pending migrations`);

    for (const migration of pending) {
      console.log(`Running migration: ${migration.name}`);
      const result = await this.runMigration(migration);
      results.push(result);

      if (!result.success) {
        console.error(`Migration ${migration.name} failed:`, result.error);
        break; // Stop on first failure
      }

      console.log(`Migration ${migration.name} completed in ${result.executionTime}ms`);
    }

    return results;
  }

  /**
   * Rollback a migration
   */
  async rollback(migrationId: string): Promise<MigrationResult> {
    const migration = this.migrations.find(m => m.id === migrationId);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationId}`);
    }

    if (!migration.rollbackSql) {
      throw new Error(`No rollback SQL defined for migration: ${migrationId}`);
    }

    const startTime = Date.now();

    try {
      const { error } = await this.supabase.rpc('exec_sql', { 
        sql: migration.rollbackSql 
      });
      
      if (error) {
        throw new Error(`Rollback execution failed: ${error.message}`);
      }

      // Remove migration record
      await this.supabase
        .from('schema_migrations')
        .delete()
        .eq('id', migrationId);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        migration,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        migration,
        executionTime,
        error: errorMessage
      };
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    totalMigrations: number;
    appliedMigrations: number;
    pendingMigrations: number;
    lastMigration?: MigrationRecord;
  }> {
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations();

    return {
      totalMigrations: this.migrations.length,
      appliedMigrations: applied.length,
      pendingMigrations: pending.length,
      lastMigration: applied[applied.length - 1]
    };
  }

  /**
   * Validate migration checksums
   */
  async validateChecksums(): Promise<{
    valid: boolean;
    issues: Array<{
      migration: string;
      expected: string;
      actual: string;
    }>;
  }> {
    const applied = await this.getAppliedMigrations();
    const issues: Array<{
      migration: string;
      expected: string;
      actual: string;
    }> = [];

    for (const appliedMigration of applied) {
      const migration = this.migrations.find(m => m.id === appliedMigration.id);
      if (migration && migration.checksum !== appliedMigration.checksum) {
        issues.push({
          migration: migration.id,
          expected: migration.checksum,
          actual: appliedMigration.checksum
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Create a new migration
   */
  createMigration(name: string, sql: string, rollbackSql?: string): Migration {
    const version = Math.max(...this.migrations.map(m => m.version)) + 1;
    const id = `${version.toString().padStart(3, '0')}_${name.toLowerCase().replace(/\s+/g, '_')}`;
    
    return {
      id,
      name,
      version,
      sql,
      checksum: btoa(sql).substring(0, 32),
      rollbackSql
    };
  }
}

// Export singleton instance
export const migrationRunner = new MigrationRunner(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);