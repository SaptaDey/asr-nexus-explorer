/**
 * WebSocket Service for Real-time Communication
 * Connects to Node.js backend for live streaming
 */

import { io, Socket } from 'socket.io-client';
import { GraphData, ResearchContext } from '@/types/asrGotTypes';
import { toast } from 'sonner';

interface WebSocketEvents {
  'session-joined': (data: { sessionId: string }) => void;
  'session-updated': (data: { sessionId: string; changes: any; timestamp: string }) => void;
  'graph-updated': (data: { type: string; payload: any; timestamp: string; from: string }) => void;
  'stage-transitioned': (data: { fromStage: number; toStage: number; success: boolean; error?: string; timestamp: string }) => void;
  'llm-stream': (data: { stage: number; content: string; isComplete: boolean; timestamp: string; from: string }) => void;
  'node-created': (data: { sessionId: string; node: any; timestamp: string }) => void;
  'edge-created': (data: { sessionId: string; edge: any; timestamp: string }) => void;
  'bias-audit-result': (data: { sessionId: string; result: any; timestamp: string }) => void;
  'user-joined': (data: { socketId: string }) => void;
  'user-left': (data: { socketId: string }) => void;
  'error': (data: { message: string }) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private currentSessionId: string | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private listeners: Map<keyof WebSocketEvents, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  // Connect to WebSocket server
  connect(): void {
    if (this.socket?.connected) return;

    this.connectionStatus = 'connecting';
    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.setupEventHandlers();
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      console.log('✅ WebSocket connected');
      toast.success('Connected to real-time server');
      
      // Rejoin session if we were in one
      if (this.currentSessionId) {
        this.joinSession(this.currentSessionId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionStatus = 'disconnected';
      console.log('❌ WebSocket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.connectionStatus = 'disconnected';
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        toast.error(`Connection failed, retrying... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      } else {
        toast.error('Could not connect to real-time server. Using offline mode.');
      }
    });

    // Set up event forwarding
    const events: (keyof WebSocketEvents)[] = [
      'session-joined', 'session-updated', 'graph-updated', 'stage-transitioned',
      'llm-stream', 'node-created', 'edge-created', 'bias-audit-result',
      'user-joined', 'user-left', 'error'
    ];

    events.forEach(eventName => {
      this.socket!.on(eventName, (data: any) => {
        this.notifyListeners(eventName, data);
      });
    });
  }

  // Reconnect logic
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('Maximum reconnection attempts reached. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  // Join a research session
  joinSession(sessionId: string): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, cannot join session');
      return;
    }

    this.currentSessionId = sessionId;
    this.socket.emit('join-session', sessionId);
  }

  // Leave current session
  leaveSession(): void {
    this.currentSessionId = null;
  }

  // Emit graph update
  emitGraphUpdate(sessionId: string, type: string, payload: any): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, cannot emit graph update');
      return;
    }

    this.socket.emit('graph-update', {
      sessionId,
      type,
      payload
    });
  }

  // Emit stage transition
  emitStageTransition(sessionId: string, fromStage: number, toStage: number, success: boolean, error?: string): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, cannot emit stage transition');
      return;
    }

    this.socket.emit('stage-transition', {
      sessionId,
      fromStage,
      toStage,
      success,
      error
    });
  }

  // Emit LLM stream
  emitLLMStream(sessionId: string, stage: number, content: string, isComplete: boolean): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, cannot emit LLM stream');
      return;
    }

    this.socket.emit('llm-stream', {
      sessionId,
      stage,
      content,
      isComplete
    });
  }

  // Subscribe to events
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): () => void {
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
  private notifyListeners(event: keyof WebSocketEvents, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
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
    return this.socket?.connected || false;
  }

  // Get current session ID
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  // Disconnect
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus = 'disconnected';
    this.currentSessionId = null;
    this.listeners.clear();
  }

  // Get socket instance (for advanced usage)
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

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
    on: <K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) =>
      webSocketService.on(event, callback),
    isConnected: () => webSocketService.isConnected(),
    getConnectionStatus: () => webSocketService.getConnectionStatus(),
    getCurrentSessionId: () => webSocketService.getCurrentSessionId()
  };
};