/**
 * Real-time Service using Supabase Realtime
 * Provides WebSocket-like functionality using Supabase channels
 */

import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';
import { GraphData, ResearchContext } from '@/types/asrGotTypes';
import { toast } from 'sonner';

interface RealtimeEvents {
  'session-joined': (data: { sessionId: string }) => void;
  'session-updated': (data: { sessionId: string; changes: any; timestamp: string }) => void;
  'graph-updated': (data: { type: string; payload: any; timestamp: string; from: string }) => void;
  'stage-transitioned': (data: { fromStage: number; toStage: number; success: boolean; error?: string; timestamp: string }) => void;
  'llm-stream': (data: { stage: number; content: string; isComplete: boolean; timestamp: string; from: string }) => void;
  'node-created': (data: { sessionId: string; node: any; timestamp: string }) => void;
  'edge-created': (data: { sessionId: string; edge: any; timestamp: string }) => void;
  'bias-audit-result': (data: { sessionId: string; result: any; timestamp: string }) => void;
  'user-joined': (data: { userId: string }) => void;
  'user-left': (data: { userId: string }) => void;
  'error': (data: { message: string }) => void;
}

class SupabaseRealtimeService {
  private channel: RealtimeChannel | null = null;
  private currentSessionId: string | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private listeners: Map<keyof RealtimeEvents, Set<Function>> = new Map();
  private clientId: string;

  constructor() {
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.connect();
  }

  // Connect to Supabase Realtime
  connect(): void {
    if (this.channel) return;

    this.connectionStatus = 'connecting';
    
    // Create a global ASR-GoT channel for real-time communication
    this.channel = supabase.channel('asr-got-global', {
      config: {
        broadcast: { self: true }
      }
    });

    this.setupEventHandlers();
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    if (!this.channel) return;

    // Subscribe to channel and handle connection status
    this.channel
      .on('broadcast', { event: '*' }, (payload) => {
        const { event, data } = payload.payload;
        
        // Don't process our own broadcasts unless explicitly configured
        if (data.from === this.clientId) return;
        
        this.notifyListeners(event as keyof RealtimeEvents, data);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.connectionStatus = 'connected';
          console.log('✅ Supabase Realtime connected');
          toast.success('Connected to real-time collaboration');
          
          // Rejoin session if we were in one
          if (this.currentSessionId) {
            this.joinSession(this.currentSessionId);
          }
        } else if (status === 'CHANNEL_ERROR') {
          this.connectionStatus = 'disconnected';
          // **SILENT ERROR HANDLING**: Don't log realtime errors - they're non-critical
          // console.warn('⚠️ Supabase Realtime connection error (continuing in offline mode)');
          // Don't show error toast for non-critical realtime features
        } else if (status === 'TIMED_OUT') {
          this.connectionStatus = 'disconnected';
          // **SILENT ERROR HANDLING**: Reduce noise for timeout errors
          // console.warn('⚠️ Supabase Realtime connection timed out');
          // Don't show warning toast - just silently reconnect
          setTimeout(() => this.reconnect(), 5000); // Retry in 5 seconds
        }
      });
  }

  // Reconnect logic - silently handle reconnections
  private reconnect(): void {
    // **SILENT ERROR HANDLING**: Don't log reconnection attempts for non-critical feature
    // console.log('Attempting to reconnect to Supabase Realtime...');
    
    // Disconnect and reconnect
    this.disconnect();
    
    setTimeout(() => {
      this.connect();
    }, 2000); // Wait 2 seconds before reconnecting
  }

  // Join a research session
  joinSession(sessionId: string): void {
    if (!this.isConnected()) {
      // **SILENT ERROR HANDLING**: Don't warn about realtime connection for non-critical feature
      // console.warn('Supabase Realtime not connected, cannot join session');
      return;
    }

    this.currentSessionId = sessionId;
    
    // Broadcast session join event
    this.broadcast('session-joined', {
      sessionId,
      userId: this.clientId,
      timestamp: new Date().toISOString()
    });
  }

  // Leave current session
  leaveSession(): void {
    if (this.currentSessionId) {
      // Broadcast session leave event
      this.broadcast('user-left', {
        userId: this.clientId,
        sessionId: this.currentSessionId,
        timestamp: new Date().toISOString()
      });
    }
    
    this.currentSessionId = null;
  }

  // Emit graph update
  emitGraphUpdate(sessionId: string, type: string, payload: any): void {
    if (!this.isConnected()) {
      // **SILENT ERROR HANDLING**: Don't warn for non-critical realtime features
      // console.warn('Supabase Realtime not connected, cannot emit graph update');
      return;
    }

    this.broadcast('graph-updated', {
      sessionId,
      type,
      payload,
      from: this.clientId,
      timestamp: new Date().toISOString()
    });
  }

  // Emit stage transition
  emitStageTransition(sessionId: string, fromStage: number, toStage: number, success: boolean, error?: string): void {
    if (!this.isConnected()) {
      // **SILENT ERROR HANDLING**: Don't warn for non-critical realtime features
      // console.warn('Supabase Realtime not connected, cannot emit stage transition');
      return;
    }

    this.broadcast('stage-transitioned', {
      sessionId,
      fromStage,
      toStage,
      success,
      error,
      from: this.clientId,
      timestamp: new Date().toISOString()
    });
  }

  // Emit LLM stream
  emitLLMStream(sessionId: string, stage: number, content: string, isComplete: boolean): void {
    if (!this.isConnected()) {
      // **SILENT ERROR HANDLING**: Don't warn for non-critical realtime features
      // console.warn('Supabase Realtime not connected, cannot emit LLM stream');
      return;
    }

    this.broadcast('llm-stream', {
      sessionId,
      stage,
      content,
      isComplete,
      from: this.clientId,
      timestamp: new Date().toISOString()
    });
  }

  // Subscribe to events
  on<K extends keyof RealtimeEvents>(event: K, callback: RealtimeEvents[K]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // Notify listeners
  private notifyListeners(event: keyof RealtimeEvents, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in Realtime event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  // Check if connected
  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.channel !== null;
  }

  // Get current session ID
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  // Disconnect
  disconnect(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.connectionStatus = 'disconnected';
    this.currentSessionId = null;
    this.listeners.clear();
  }

  // Broadcast event to channel
  private broadcast(event: string, data: any): void {
    if (!this.channel) {
      // **SILENT ERROR HANDLING**: Don't warn about broadcast failures for non-critical features
      // console.warn('Cannot broadcast: channel not available');
      return;
    }

    this.channel.send({
      type: 'broadcast',
      event: 'realtime-event',
      payload: { event, data }
    }).catch(error => {
      // **SILENT ERROR HANDLING**: Don't log broadcast errors - they're non-critical
      // console.error('Failed to broadcast event:', error);
    });
  }

  // Get channel instance (for advanced usage)
  getChannel(): RealtimeChannel | null {
    return this.channel;
  }
}

// Create singleton instance
export const webSocketService = new SupabaseRealtimeService();

// React hook for using WebSocket service
export const useWebSocket = () => {
  return {
    connect: () => webSocketService.connect(),
    disconnect: () => webSocketService.disconnect(),
    joinSession: (sessionId: string) => webSocketService.joinSession(sessionId),
    leaveSession: () => webSocketService.leaveSession(),
    emitGraphUpdate: (sessionId: string, type: string, payload: any) => 
      webSocketService.emitGraphUpdate(sessionId, type, payload),
    emitStageTransition: (sessionId: string, fromStage: number, toStage: number, success: boolean, error?: string) =>
      webSocketService.emitStageTransition(sessionId, fromStage, toStage, success, error),
    emitLLMStream: (sessionId: string, stage: number, content: string, isComplete: boolean) =>
      webSocketService.emitLLMStream(sessionId, stage, content, isComplete),
    on: <K extends keyof RealtimeEvents>(event: K, callback: RealtimeEvents[K]) =>
      webSocketService.on(event, callback),
    isConnected: () => webSocketService.isConnected(),
    getConnectionStatus: () => webSocketService.getConnectionStatus(),
    getCurrentSessionId: () => webSocketService.getCurrentSessionId()
  };
};