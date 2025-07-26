/**
 * Event Broadcasting System for ASR-GoT
 * Handles graph-updated events and live streaming
 */

export interface GraphUpdateEvent {
  type: 'graph-updated';
  stage: number;
  nodeCount: number;
  edgeCount: number;
  timestamp: string;
  changes: {
    nodesAdded: number;
    edgesAdded: number;
    nodesModified: number;
    edgesModified: number;
  };
}

export interface StageTransitionEvent {
  type: 'stage-transition';
  fromStage: number;
  toStage: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface LLMStreamEvent {
  type: 'llm-stream';
  stage: number;
  content: string;
  isComplete: boolean;
  timestamp: string;
}

export type BroadcastEvent = GraphUpdateEvent | StageTransitionEvent | LLMStreamEvent;

class EventBroadcaster {
  private listeners: Map<string, Set<(event: BroadcastEvent) => void>> = new Map();
  private eventHistory: BroadcastEvent[] = [];
  private maxHistorySize = 100;

  // Subscribe to events
  subscribe(eventType: BroadcastEvent['type'], callback: (event: BroadcastEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.add(callback);
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  // Broadcast event to all subscribers
  broadcast(event: BroadcastEvent): void {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify subscribers
    const subscribers = this.listeners.get(event.type);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event subscriber:', error);
        }
      });
    }

    // Log event for debugging
    console.log(`[EventBroadcaster] ${event.type}:`, event);
  }

  // Get event history
  getEventHistory(): BroadcastEvent[] {
    return [...this.eventHistory];
  }

  // Clear all listeners
  clear(): void {
    this.listeners.clear();
  }

  // Get subscriber count for an event type
  getSubscriberCount(eventType: BroadcastEvent['type']): number {
    return this.listeners.get(eventType)?.size || 0;
  }

  // Broadcast graph update event
  broadcastGraphUpdate(stage: number, nodeCount: number, edgeCount: number, changes: GraphUpdateEvent['changes']): void {
    this.broadcast({
      type: 'graph-updated',
      stage,
      nodeCount,
      edgeCount,
      timestamp: new Date().toISOString(),
      changes
    });
  }

  // Broadcast stage transition event
  broadcastStageTransition(fromStage: number, toStage: number, success: boolean, error?: string): void {
    this.broadcast({
      type: 'stage-transition',
      fromStage,
      toStage,
      timestamp: new Date().toISOString(),
      success,
      error
    });
  }

  // Broadcast LLM stream event
  broadcastLLMStream(stage: number, content: string, isComplete: boolean): void {
    this.broadcast({
      type: 'llm-stream',
      stage,
      content,
      isComplete,
      timestamp: new Date().toISOString()
    });
  }
}

// Global singleton instance
export const eventBroadcaster = new EventBroadcaster();

// Hook for React components
export const useEventBroadcaster = () => {
  return {
    subscribe: eventBroadcaster.subscribe.bind(eventBroadcaster),
    broadcast: eventBroadcaster.broadcast.bind(eventBroadcaster),
    getEventHistory: eventBroadcaster.getEventHistory.bind(eventBroadcaster),
    broadcastGraphUpdate: eventBroadcaster.broadcastGraphUpdate.bind(eventBroadcaster),
    broadcastStageTransition: eventBroadcaster.broadcastStageTransition.bind(eventBroadcaster),
    broadcastLLMStream: eventBroadcaster.broadcastLLMStream.bind(eventBroadcaster)
  };
};