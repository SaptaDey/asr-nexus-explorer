/**
 * Session Persistence Service
 * Handles database operations for session management
 */

import { GraphData, ResearchContext, ASRGoTParameters } from '@/types/asrGotTypes';

interface SessionData {
  id: string;
  topic: string;
  field: string;
  currentStage: number;
  isComplete: boolean;
  graphData: GraphData;
  parameters: ASRGoTParameters;
  stageResults: string[];
  researchContext: ResearchContext;
  apiUsage?: any;
  createdAt: string;
  updatedAt: string;
}

interface CreateSessionRequest {
  topic: string;
  field: string;
  userId?: string;
}

interface UpdateSessionRequest {
  currentStage?: number;
  isComplete?: boolean;
  graphData?: GraphData;
  parameters?: ASRGoTParameters;
  stageResults?: string[];
  researchContext?: ResearchContext;
  apiUsage?: any;
}

class SessionPersistenceService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  // Create a new research session
  async createSession(data: CreateSessionRequest): Promise<{ sessionId: string; session: SessionData }> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Session creation failed:', error);
      throw error;
    }
  }

  // Load an existing session
  async loadSession(sessionId: string): Promise<{ session: SessionData }> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Session not found');
        }
        throw new Error(`Failed to load session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Session loading failed:', error);
      throw error;
    }
  }

  // Update session data
  async updateSession(sessionId: string, updates: UpdateSessionRequest): Promise<{ session: SessionData }> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Session update failed:', error);
      throw error;
    }
  }

  // Create a graph node
  async createNode(sessionId: string, nodeData: any): Promise<{ node: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nodeData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create node: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Node creation failed:', error);
      throw error;
    }
  }

  // Create a graph edge
  async createEdge(sessionId: string, edgeData: any): Promise<{ edge: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/edges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(edgeData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create edge: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Edge creation failed:', error);
      throw error;
    }
  }

  // Track API usage
  async trackApiUsage(data: {
    sessionId?: string;
    userId?: string;
    service: string;
    tokens: number;
    cost: number;
    endpoint?: string;
  }): Promise<{ usage: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to track usage: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Usage tracking failed:', error);
      throw error;
    }
  }

  // Save bias audit result
  async saveBiasAuditResult(sessionId: string, auditData: {
    category: string;
    title: string;
    description: string;
    status: string;
    details: string;
    impactLevel: string;
    recommendation?: string;
    relatedNodes?: string[];
  }): Promise<{ result: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/bias-audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(auditData)
      });

      if (!response.ok) {
        throw new Error(`Failed to save bias audit: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Bias audit save failed:', error);
      throw error;
    }
  }

  // Auto-save session data
  async autoSave(sessionId: string, data: Partial<SessionData>): Promise<void> {
    try {
      // Debounced auto-save to avoid too many requests
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
      }

      this.autoSaveTimeout = setTimeout(async () => {
        try {
          await this.updateSession(sessionId, data);
          console.log('Auto-saved session data');
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      }, 2000); // Auto-save after 2 seconds of inactivity
    } catch (error) {
      console.warn('Auto-save setup failed:', error);
    }
  }

  private autoSaveTimeout: number | null = null;

  // Clear auto-save timeout
  clearAutoSave(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }

  // Check server health
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Get server status
  async getServerStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Server not responding');
    } catch (error) {
      return {
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Create singleton instance
export const sessionPersistence = new SessionPersistenceService();

// React hook for session persistence
export const useSessionPersistence = () => {
  return {
    createSession: (data: CreateSessionRequest) => sessionPersistence.createSession(data),
    loadSession: (sessionId: string) => sessionPersistence.loadSession(sessionId),
    updateSession: (sessionId: string, updates: UpdateSessionRequest) => 
      sessionPersistence.updateSession(sessionId, updates),
    createNode: (sessionId: string, nodeData: any) => 
      sessionPersistence.createNode(sessionId, nodeData),
    createEdge: (sessionId: string, edgeData: any) => 
      sessionPersistence.createEdge(sessionId, edgeData),
    trackApiUsage: (data: any) => sessionPersistence.trackApiUsage(data),
    saveBiasAuditResult: (sessionId: string, auditData: any) => 
      sessionPersistence.saveBiasAuditResult(sessionId, auditData),
    autoSave: (sessionId: string, data: Partial<SessionData>) => 
      sessionPersistence.autoSave(sessionId, data),
    clearAutoSave: () => sessionPersistence.clearAutoSave(),
    checkHealth: () => sessionPersistence.checkHealth(),
    getServerStatus: () => sessionPersistence.getServerStatus()
  };
};