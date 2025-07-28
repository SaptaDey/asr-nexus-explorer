/**
 * Research Session State Synchronization Service
 * Handles real-time synchronization of research session state across clients
 */

import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { DatabaseService, DbResearchSession } from '../database/DatabaseService';
import { GraphData } from '@/types/asrGotTypes';

export interface SessionState {
  session: DbResearchSession;
  graphData: GraphData | null;
  stageResults: Record<string, any>;
  currentStage: number;
  stageProgress: number;
  lastUpdated: string;
  activeUsers: string[];
  locks: Record<string, { user_id: string; timestamp: string; type: 'stage' | 'graph' | 'session' }>;
}

export interface StateUpdate {
  type: 'session_update' | 'graph_update' | 'stage_progress' | 'stage_completed' | 'user_activity';
  data: any;
  user_id: string;
  timestamp: string;
  session_id: string;
}

export interface SyncConflict {
  id: string;
  type: 'concurrent_edit' | 'version_mismatch' | 'lock_violation';
  description: string;
  local_data: any;
  remote_data: any;
  resolution_options: Array<{
    action: 'accept_local' | 'accept_remote' | 'merge' | 'manual';
    description: string;
  }>;
}

export interface SyncOptions {
  enableRealTime: boolean;
  conflictResolution: 'auto' | 'manual';
  syncInterval: number; // milliseconds
  retryAttempts: number;
  enableOfflineMode: boolean;
}

export class SessionSyncService {
  private supabase: SupabaseClient;
  private db: DatabaseService;
  private channels: Map<string, RealtimeChannel> = new Map();
  private sessionStates: Map<string, SessionState> = new Map();
  private syncQueues: Map<string, StateUpdate[]> = new Map();
  private conflicts: Map<string, SyncConflict[]> = new Map();
  private syncTimers: Map<string, NodeJS.Timeout> = new Map();

  // Event callbacks
  private onStateUpdate?: (sessionId: string, update: StateUpdate) => void;
  private onConflict?: (sessionId: string, conflict: SyncConflict) => void;
  private onSyncError?: (sessionId: string, error: Error) => void;
  private onConnectionChange?: (sessionId: string, isConnected: boolean) => void;

  constructor() {
    this.supabase = supabase;
    this.db = new DatabaseService();
  }

  /**
   * Start synchronization for a session
   */
  async startSync(
    sessionId: string,
    options: Partial<SyncOptions> = {},
    callbacks: {
      onStateUpdate?: (sessionId: string, update: StateUpdate) => void;
      onConflict?: (sessionId: string, conflict: SyncConflict) => void;
      onSyncError?: (sessionId: string, error: Error) => void;
      onConnectionChange?: (sessionId: string, isConnected: boolean) => void;
    } = {}
  ): Promise<SessionState> {
    try {
      // Set callbacks
      this.onStateUpdate = callbacks.onStateUpdate;
      this.onConflict = callbacks.onConflict;
      this.onSyncError = callbacks.onSyncError;
      this.onConnectionChange = callbacks.onConnectionChange;

      const defaultOptions: SyncOptions = {
        enableRealTime: true,
        conflictResolution: 'manual',
        syncInterval: 5000,
        retryAttempts: 3,
        enableOfflineMode: false,
        ...options
      };

      // Load initial state
      const initialState = await this.loadSessionState(sessionId);
      this.sessionStates.set(sessionId, initialState);

      // Set up real-time sync if enabled
      if (defaultOptions.enableRealTime) {
        await this.setupRealtimeSync(sessionId);
      }

      // Set up periodic sync
      if (defaultOptions.syncInterval > 0) {
        this.setupPeriodicSync(sessionId, defaultOptions.syncInterval);
      }

      // Initialize sync queue
      this.syncQueues.set(sessionId, []);
      this.conflicts.set(sessionId, []);

      // Mark user as active
      await this.markUserActive(sessionId);

      return initialState;

    } catch (error) {
      console.error('Failed to start sync:', error);
      if (this.onSyncError) {
        this.onSyncError(sessionId, error as Error);
      }
      throw error;
    }
  }

  /**
   * Stop synchronization for a session
   */
  async stopSync(sessionId: string): Promise<void> {
    try {
      // Clean up real-time channel
      const channel = this.channels.get(sessionId);
      if (channel) {
        await channel.unsubscribe();
        this.channels.delete(sessionId);
      }

      // Clear periodic sync timer
      const timer = this.syncTimers.get(sessionId);
      if (timer) {
        clearInterval(timer);
        this.syncTimers.delete(sessionId);
      }

      // Process any pending sync queue
      await this.processSyncQueue(sessionId);

      // Mark user as inactive
      await this.markUserInactive(sessionId);

      // Clean up state
      this.sessionStates.delete(sessionId);
      this.syncQueues.delete(sessionId);
      this.conflicts.delete(sessionId);

    } catch (error) {
      console.error('Failed to stop sync:', error);
    }
  }

  /**
   * Update session state locally and queue for sync
   */
  async updateSessionState(
    sessionId: string,
    updates: Partial<SessionState>,
    immediate: boolean = false
  ): Promise<void> {
    try {
      const currentState = this.sessionStates.get(sessionId);
      if (!currentState) {
        throw new Error('Session not synchronized');
      }

      // Create state update
      const stateUpdate: StateUpdate = {
        type: 'session_update',
        data: updates,
        user_id: (await this.db.getCurrentUser())?.id || 'unknown',
        timestamp: new Date().toISOString(),
        session_id: sessionId
      };

      // Update local state
      const newState: SessionState = {
        ...currentState,
        ...updates,
        lastUpdated: stateUpdate.timestamp
      };
      this.sessionStates.set(sessionId, newState);

      // Queue for sync
      this.queueStateUpdate(sessionId, stateUpdate);

      if (immediate) {
        await this.processSyncQueue(sessionId);
      }

      // Notify callbacks
      if (this.onStateUpdate) {
        this.onStateUpdate(sessionId, stateUpdate);
      }

    } catch (error) {
      console.error('Failed to update session state:', error);
      if (this.onSyncError) {
        this.onSyncError(sessionId, error as Error);
      }
    }
  }

  /**
   * Update graph data with conflict detection
   */
  async updateGraphData(
    sessionId: string,
    graphData: GraphData,
    immediate: boolean = false
  ): Promise<void> {
    try {
      // Check for potential conflicts
      const currentState = this.sessionStates.get(sessionId);
      if (currentState?.graphData) {
        const conflict = await this.detectGraphConflict(sessionId, graphData, currentState.graphData);
        if (conflict) {
          this.handleConflict(sessionId, conflict);
          return;
        }
      }

      await this.updateSessionState(sessionId, { graphData }, immediate);

    } catch (error) {
      console.error('Failed to update graph data:', error);
      if (this.onSyncError) {
        this.onSyncError(sessionId, error as Error);
      }
    }
  }

  /**
   * Update stage progress
   */
  async updateStageProgress(
    sessionId: string,
    stageNumber: number,
    progress: number,
    stageResults?: any
  ): Promise<void> {
    try {
      const updates: Partial<SessionState> = {
        currentStage: stageNumber,
        stageProgress: progress
      };

      if (stageResults) {
        const currentState = this.sessionStates.get(sessionId);
        updates.stageResults = {
          ...currentState?.stageResults,
          [`stage_${stageNumber}`]: stageResults
        };
      }

      await this.updateSessionState(sessionId, updates, true);

      // Create specific stage progress update
      const stageUpdate: StateUpdate = {
        type: 'stage_progress',
        data: { stage: stageNumber, progress, results: stageResults },
        user_id: (await this.db.getCurrentUser())?.id || 'unknown',
        timestamp: new Date().toISOString(),
        session_id: sessionId
      };

      this.queueStateUpdate(sessionId, stageUpdate);
      await this.processSyncQueue(sessionId);

    } catch (error) {
      console.error('Failed to update stage progress:', error);
      if (this.onSyncError) {
        this.onSyncError(sessionId, error as Error);
      }
    }
  }

  /**
   * Get current session state
   */
  getSessionState(sessionId: string): SessionState | null {
    return this.sessionStates.get(sessionId) || null;
  }

  /**
   * Get pending conflicts
   */
  getConflicts(sessionId: string): SyncConflict[] {
    return this.conflicts.get(sessionId) || [];
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    sessionId: string,
    conflictId: string,
    resolution: 'accept_local' | 'accept_remote' | 'merge' | 'manual',
    mergedData?: any
  ): Promise<void> {
    try {
      const conflicts = this.conflicts.get(sessionId) || [];
      const conflictIndex = conflicts.findIndex(c => c.id === conflictId);
      
      if (conflictIndex === -1) {
        throw new Error('Conflict not found');
      }

      const conflict = conflicts[conflictIndex];
      let resolvedData: any;

      switch (resolution) {
        case 'accept_local':
          resolvedData = conflict.local_data;
          break;
        case 'accept_remote':
          resolvedData = conflict.remote_data;
          break;
        case 'merge':
          resolvedData = this.mergeConflictData(conflict.local_data, conflict.remote_data);
          break;
        case 'manual':
          if (!mergedData) {
            throw new Error('Manual resolution requires merged data');
          }
          resolvedData = mergedData;
          break;
        default:
          throw new Error(`Unknown resolution type: ${resolution}`);
      }

      // Apply resolved data
      await this.updateSessionState(sessionId, resolvedData, true);

      // Remove conflict
      conflicts.splice(conflictIndex, 1);
      this.conflicts.set(sessionId, conflicts);

    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      if (this.onSyncError) {
        this.onSyncError(sessionId, error as Error);
      }
    }
  }

  /**
   * Force sync with remote state
   */
  async forceSync(sessionId: string): Promise<void> {
    try {
      const remoteState = await this.loadSessionState(sessionId);
      this.sessionStates.set(sessionId, remoteState);

      // Clear any pending sync queue
      this.syncQueues.set(sessionId, []);

      // Notify callbacks
      if (this.onStateUpdate) {
        this.onStateUpdate(sessionId, {
          type: 'session_update',
          data: remoteState,
          user_id: 'system',
          timestamp: new Date().toISOString(),
          session_id: sessionId
        });
      }

    } catch (error) {
      console.error('Failed to force sync:', error);
      if (this.onSyncError) {
        this.onSyncError(sessionId, error as Error);
      }
    }
  }

  /**
   * Private helper methods
   */
  private async loadSessionState(sessionId: string): Promise<SessionState> {
    const [session, graphData, stageExecutions] = await Promise.all([
      this.db.getResearchSession(sessionId),
      this.db.getGraphData(sessionId),
      this.db.getStageExecutions(sessionId)
    ]);

    if (!session) {
      throw new Error('Session not found');
    }

    // Build stage results from executions
    const stageResults = stageExecutions.reduce((acc, execution) => {
      if (execution.output_data) {
        acc[`stage_${execution.stage_number}`] = execution.output_data;
      }
      return acc;
    }, {} as Record<string, any>);

    // Get active users (simplified)
    const activeUsers = await this.getActiveUsers(sessionId);

    return {
      session,
      graphData,
      stageResults,
      currentStage: session.current_stage,
      stageProgress: 0, // Would need to be stored/calculated
      lastUpdated: session.updated_at,
      activeUsers,
      locks: {} // Would need to be implemented
    };
  }

  private async setupRealtimeSync(sessionId: string): Promise<void> {
    const channel = this.supabase
      .channel(`session_sync_${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'research_sessions',
        filter: `id=eq.${sessionId}`
      }, (payload) => {
        this.handleRemoteSessionUpdate(sessionId, payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'graph_nodes',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        this.handleRemoteGraphUpdate(sessionId, payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'graph_edges',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        this.handleRemoteGraphUpdate(sessionId, payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stage_executions',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        this.handleRemoteStageUpdate(sessionId, payload);
      })
      .subscribe((status) => {
        const isConnected = status === 'SUBSCRIBED';
        if (this.onConnectionChange) {
          this.onConnectionChange(sessionId, isConnected);
        }
      });

    this.channels.set(sessionId, channel);
  }

  private setupPeriodicSync(sessionId: string, interval: number): void {
    const timer = setInterval(async () => {
      try {
        await this.processSyncQueue(sessionId);
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, interval);

    this.syncTimers.set(sessionId, timer);
  }

  private queueStateUpdate(sessionId: string, update: StateUpdate): void {
    const queue = this.syncQueues.get(sessionId) || [];
    queue.push(update);
    this.syncQueues.set(sessionId, queue);
  }

  private async processSyncQueue(sessionId: string): Promise<void> {
    const queue = this.syncQueues.get(sessionId) || [];
    if (queue.length === 0) return;

    try {
      // Group updates by type for efficient processing
      const groupedUpdates = queue.reduce((groups, update) => {
        if (!groups[update.type]) {
          groups[update.type] = [];
        }
        groups[update.type].push(update);
        return groups;
      }, {} as Record<string, StateUpdate[]>);

      // Process each group
      for (const [type, updates] of Object.entries(groupedUpdates)) {
        await this.processUpdateGroup(sessionId, type as StateUpdate['type'], updates);
      }

      // Clear processed queue
      this.syncQueues.set(sessionId, []);

    } catch (error) {
      console.error('Failed to process sync queue:', error);
      if (this.onSyncError) {
        this.onSyncError(sessionId, error as Error);
      }
    }
  }

  private async processUpdateGroup(
    sessionId: string,
    type: StateUpdate['type'],
    updates: StateUpdate[]
  ): Promise<void> {
    const latestUpdate = updates[updates.length - 1];

    switch (type) {
      case 'session_update':
        await this.db.updateResearchSession(sessionId, latestUpdate.data);
        break;
      case 'graph_update':
        await this.db.saveGraphData(sessionId, latestUpdate.data);
        break;
      case 'stage_progress':
        // Update stage execution
        break;
      case 'stage_completed':
        // Mark stage as completed
        break;
    }
  }

  private async detectGraphConflict(
    sessionId: string,
    localGraph: GraphData,
    remoteGraph: GraphData
  ): Promise<SyncConflict | null> {
    // Simple conflict detection based on timestamps and node/edge counts
    const localTimestamp = Date.now();
    const remoteTimestamp = new Date(this.sessionStates.get(sessionId)?.lastUpdated || '').getTime();

    if (Math.abs(localTimestamp - remoteTimestamp) < 5000) { // 5 second window
      const localCount = localGraph.nodes.length + localGraph.edges.length;
      const remoteCount = remoteGraph.nodes.length + remoteGraph.edges.length;

      if (localCount !== remoteCount) {
        return {
          id: `conflict_${sessionId}_${Date.now()}`,
          type: 'concurrent_edit',
          description: 'Concurrent graph modifications detected',
          local_data: localGraph,
          remote_data: remoteGraph,
          resolution_options: [
            { action: 'accept_local', description: 'Keep your changes' },
            { action: 'accept_remote', description: 'Accept remote changes' },
            { action: 'merge', description: 'Attempt automatic merge' },
            { action: 'manual', description: 'Manually resolve conflicts' }
          ]
        };
      }
    }

    return null;
  }

  private handleConflict(sessionId: string, conflict: SyncConflict): void {
    const conflicts = this.conflicts.get(sessionId) || [];
    conflicts.push(conflict);
    this.conflicts.set(sessionId, conflicts);

    if (this.onConflict) {
      this.onConflict(sessionId, conflict);
    }
  }

  private mergeConflictData(localData: any, remoteData: any): any {
    // Simple merge strategy - this could be enhanced
    if (typeof localData === 'object' && typeof remoteData === 'object') {
      return { ...remoteData, ...localData };
    }
    return localData; // Prefer local data as default
  }

  private async getActiveUsers(sessionId: string): Promise<string[]> {
    // This would query recent activity logs
    try {
      const { data, error } = await this.supabase
        .from('activity_logs')
        .select('user_id')
        .eq('session_id', sessionId)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .order('created_at', { ascending: false });

      if (error) throw error;

      const uniqueUsers = Array.from(new Set(data?.map(log => log.user_id) || []));
      return uniqueUsers;
    } catch (error) {
      console.error('Failed to get active users:', error);
      return [];
    }
  }

  private async markUserActive(sessionId: string): Promise<void> {
    try {
      const user = await this.db.getCurrentUser();
      if (user) {
        await this.supabase
          .from('activity_logs')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            activity_type: 'user_active',
            activity_data: { timestamp: new Date().toISOString() }
          });
      }
    } catch (error) {
      console.error('Failed to mark user active:', error);
    }
  }

  private async markUserInactive(sessionId: string): Promise<void> {
    try {
      const user = await this.db.getCurrentUser();
      if (user) {
        await this.supabase
          .from('activity_logs')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            activity_type: 'user_inactive',
            activity_data: { timestamp: new Date().toISOString() }
          });
      }
    } catch (error) {
      console.error('Failed to mark user inactive:', error);
    }
  }

  private handleRemoteSessionUpdate(sessionId: string, payload: any): void {
    // Handle remote session updates
    if (this.onStateUpdate) {
      this.onStateUpdate(sessionId, {
        type: 'session_update',
        data: payload.new,
        user_id: 'remote',
        timestamp: new Date().toISOString(),
        session_id: sessionId
      });
    }
  }

  private handleRemoteGraphUpdate(sessionId: string, payload: any): void {
    // Handle remote graph updates
    if (this.onStateUpdate) {
      this.onStateUpdate(sessionId, {
        type: 'graph_update',
        data: payload.new,
        user_id: 'remote',
        timestamp: new Date().toISOString(),
        session_id: sessionId
      });
    }
  }

  private handleRemoteStageUpdate(sessionId: string, payload: any): void {
    // Handle remote stage updates
    if (this.onStateUpdate) {
      this.onStateUpdate(sessionId, {
        type: 'stage_progress',
        data: payload.new,
        user_id: 'remote',
        timestamp: new Date().toISOString(),
        session_id: sessionId
      });
    }
  }
}

// Singleton instance
export const sessionSyncService = new SessionSyncService();