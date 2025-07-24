/**
 * Initialization Service
 * Manages service initialization order to prevent deadlocks and ensure proper startup
 */

import { supabase } from '@/integrations/supabase/client';
import { DatabaseService } from '@/services/database/DatabaseService';
import { CollaborationService } from '@/services/collaboration/CollaborationService';
import { AuthService } from '@/services/auth/AuthService';

export interface InitializationPhase {
  phase: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  dependencies: string[];
  timeout: number;
  startTime?: number;
  endTime?: number;
  error?: string;
}

export interface InitializationState {
  currentPhase: string | null;
  phases: Map<string, InitializationPhase>;
  isComplete: boolean;
  hasErrors: boolean;
  totalTime: number;
}

export class InitializationService {
  private static instance: InitializationService;
  private state: InitializationState;
  private listeners: Array<(state: InitializationState) => void> = [];
  private timeoutHandles: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.state = {
      currentPhase: null,
      phases: new Map(),
      isComplete: false,
      hasErrors: false,
      totalTime: 0
    };

    this.initializePhases();
  }

  static getInstance(): InitializationService {
    if (!InitializationService.instance) {
      InitializationService.instance = new InitializationService();
    }
    return InitializationService.instance;
  }

  private initializePhases() {
    const phases: InitializationPhase[] = [
      {
        phase: 'core',
        description: 'Initialize core system components',
        status: 'pending',
        dependencies: [],
        timeout: 5000
      },
      {
        phase: 'auth',
        description: 'Initialize authentication system',
        status: 'pending',
        dependencies: ['core'],
        timeout: 10000
      },
      {
        phase: 'database',
        description: 'Initialize database services',
        status: 'pending',
        dependencies: ['auth'],
        timeout: 15000
      },
      {
        phase: 'collaboration',
        description: 'Initialize collaboration services',
        status: 'pending',
        dependencies: ['database'],
        timeout: 10000
      },
      {
        phase: 'storage',
        description: 'Initialize storage services',
        status: 'pending',
        dependencies: ['auth'],
        timeout: 10000
      },
      {
        phase: 'realtime',
        description: 'Initialize real-time subscriptions',
        status: 'pending',
        dependencies: ['database', 'collaboration'],
        timeout: 8000
      },
      {
        phase: 'finalization',
        description: 'Complete system initialization',
        status: 'pending',
        dependencies: ['database', 'collaboration', 'storage'],
        timeout: 5000
      }
    ];

    phases.forEach(phase => {
      this.state.phases.set(phase.phase, phase);
    });
  }

  /**
   * Subscribe to initialization state changes
   */
  subscribe(listener: (state: InitializationState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current initialization state
   */
  getState(): InitializationState {
    return { ...this.state };
  }

  /**
   * Start the initialization process
   */
  async initialize(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting ASR-GoT system initialization...');
      
      // Execute phases in dependency order
      const executionOrder = this.calculateExecutionOrder();
      
      for (const phaseId of executionOrder) {
        const phase = this.state.phases.get(phaseId);
        if (!phase) continue;

        try {
          await this.executePhase(phaseId);
        } catch (error) {
          console.error(`❌ Phase ${phaseId} failed:`, error);
          phase.status = 'failed';
          phase.error = error instanceof Error ? error.message : 'Unknown error';
          phase.endTime = Date.now();
          
          this.state.hasErrors = true;
          this.notifyListeners();
          
          // Stop initialization on critical phase failure
          if (['core', 'auth', 'database'].includes(phaseId)) {
            throw error;
          }
        }
      }

      this.state.isComplete = true;
      this.state.totalTime = Date.now() - startTime;
      
      console.log(`✅ ASR-GoT initialization completed in ${this.state.totalTime}ms`);
      this.notifyListeners();
      
      return !this.state.hasErrors;
      
    } catch (error) {
      console.error('💥 Critical initialization failure:', error);
      this.state.hasErrors = true;
      this.state.totalTime = Date.now() - startTime;
      this.notifyListeners();
      return false;
    }
  }

  private calculateExecutionOrder(): string[] {
    const phases = Array.from(this.state.phases.keys());
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (phaseId: string) => {
      if (visiting.has(phaseId)) {
        throw new Error(`Circular dependency detected involving phase: ${phaseId}`);
      }
      
      if (visited.has(phaseId)) {
        return;
      }

      visiting.add(phaseId);
      
      const phase = this.state.phases.get(phaseId);
      if (phase) {
        for (const dependency of phase.dependencies) {
          visit(dependency);
        }
      }

      visiting.delete(phaseId);
      visited.add(phaseId);
      order.push(phaseId);
    };

    for (const phaseId of phases) {
      if (!visited.has(phaseId)) {
        visit(phaseId);
      }
    }

    return order;
  }

  private async executePhase(phaseId: string): Promise<void> {
    const phase = this.state.phases.get(phaseId);
    if (!phase) throw new Error(`Phase ${phaseId} not found`);

    console.log(`⏳ Executing phase: ${phaseId} - ${phase.description}`);
    
    phase.status = 'running';
    phase.startTime = Date.now();
    this.state.currentPhase = phaseId;
    this.notifyListeners();

    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Phase ${phaseId} timed out after ${phase.timeout}ms`));
      }, phase.timeout);
      
      this.timeoutHandles.set(phaseId, timeoutHandle);
    });

    try {
      // Execute phase logic
      const executionPromise = this.runPhaseLogic(phaseId);
      
      await Promise.race([executionPromise, timeoutPromise]);
      
      // Clear timeout on success
      const timeoutHandle = this.timeoutHandles.get(phaseId);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.timeoutHandles.delete(phaseId);
      }

      phase.status = 'completed';
      phase.endTime = Date.now();
      
      console.log(`✅ Phase ${phaseId} completed in ${phase.endTime - (phase.startTime || 0)}ms`);
      
    } catch (error) {
      // Clear timeout on error
      const timeoutHandle = this.timeoutHandles.get(phaseId);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.timeoutHandles.delete(phaseId);
      }
      
      throw error;
    }
  }

  private async runPhaseLogic(phaseId: string): Promise<void> {
    switch (phaseId) {
      case 'core':
        await this.initializeCore();
        break;
        
      case 'auth':
        await this.initializeAuth();
        break;
        
      case 'database':
        await this.initializeDatabase();
        break;
        
      case 'collaboration':
        await this.initializeCollaboration();
        break;
        
      case 'storage':
        await this.initializeStorage();
        break;
        
      case 'realtime':
        await this.initializeRealtime();
        break;
        
      case 'finalization':
        await this.finalizeInitialization();
        break;
        
      default:
        throw new Error(`Unknown phase: ${phaseId}`);
    }
  }

  private async initializeCore(): Promise<void> {
    // Validate environment
    if (typeof window === 'undefined') {
      throw new Error('Browser environment required');
    }

    // Check for required APIs
    if (!window.fetch) {
      throw new Error('Fetch API not available');
    }

    // Initialize error handling
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.addEventListener('error', this.handleGlobalError);
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Get current session without triggering auth change events
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Auth session check failed:', error);
        // Non-critical error - continue initialization
      }

      // Verify auth service is responsive
      await AuthService.getInstance().initialize();
      
    } catch (error) {
      throw new Error(`Auth initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      const dbService = DatabaseService.getInstance();
      await dbService.initialize();
      
      // Test database connectivity
      const healthCheck = await dbService.getHealthStatus();
      if (!healthCheck.healthy) {
        throw new Error('Database health check failed');
      }
      
    } catch (error) {
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async initializeCollaboration(): Promise<void> {
    try {
      const collaborationService = new CollaborationService();
      await collaborationService.initialize();
      
    } catch (error) {
      console.warn('Collaboration service initialization failed:', error);
      // Non-critical - continue initialization
    }
  }

  private async initializeStorage(): Promise<void> {
    try {
      // Initialize storage buckets
      const { supabaseStorage } = await import('@/services/SupabaseStorageService');
      await supabaseStorage.initializeStorage();
      
    } catch (error) {
      console.warn('Storage initialization failed:', error);
      // Non-critical - continue initialization
    }
  }

  private async initializeRealtime(): Promise<void> {
    try {
      // Test realtime connection
      const channel = supabase.channel('init-test');
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Realtime connection timeout'));
        }, 5000);

        channel
          .on('presence', { event: 'sync' }, () => {
            clearTimeout(timeout);
            resolve();
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              resolve();
            } else if (status === 'CLOSED') {
              clearTimeout(timeout);
              reject(new Error('Realtime connection closed'));
            }
          });
      });

      // Clean up test channel
      await supabase.removeChannel(channel);
      
    } catch (error) {
      console.warn('Realtime initialization failed:', error);
      // Non-critical - continue initialization
    }
  }

  private async finalizeInitialization(): Promise<void> {
    // Perform final system checks
    await this.performSystemHealthCheck();
    
    // Clear any temporary data
    this.cleanupInitialization();
  }

  private async performSystemHealthCheck(): Promise<void> {
    const checks = [
      () => DatabaseService.getInstance().getHealthStatus(),
      () => AuthService.getInstance().getHealthStatus()
    ];

    const results = await Promise.allSettled(checks.map(check => check()));
    
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      console.warn('System health check warnings:', failures);
    }
  }

  private cleanupInitialization(): void {
    // Clear any timeout handles
    this.timeoutHandles.forEach((handle) => clearTimeout(handle));
    this.timeoutHandles.clear();
    
    // Remove error listeners
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection during initialization:', event.reason);
  };

  private handleGlobalError = (event: ErrorEvent) => {
    console.error('Global error during initialization:', event.error);
  };

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('Initialization listener error:', error);
      }
    });
  }

  /**
   * Reset initialization state (for testing or retry scenarios)
   */
  reset(): void {
    this.cleanupInitialization();
    
    this.state = {
      currentPhase: null,
      phases: new Map(),
      isComplete: false,
      hasErrors: false,
      totalTime: 0
    };
    
    this.initializePhases();
    this.notifyListeners();
  }
}