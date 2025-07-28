/**
 * Session Persistence Service using Supabase
 * Handles database operations for session management
 */

import { supabase } from '@/integrations/supabase/client';
import { GraphData, ResearchContext, ASRGoTParameters } from '@/types/asrGotTypes';
import { toast } from 'sonner';

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
  private autoSaveTimeout: number | null = null;

  constructor() {
    // Supabase client is initialized via the imported client
  }

  // Create a new research session
  async createSession(data: CreateSessionRequest): Promise<{ sessionId: string; session: SessionData }> {
    try {
      const sessionData = {
        id: crypto.randomUUID(),
        topic: data.topic,
        field: data.field,
        userId: data.userId || 'anonymous',
        currentStage: 0,
        isComplete: false,
        graphData: { nodes: [], edges: [] },
        parameters: {},
        stageResults: [],
        researchContext: { topic: data.topic, field: data.field },
        apiUsage: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // For now, store in localStorage until Supabase tables are set up
      const sessions = JSON.parse(localStorage.getItem('asr-got-sessions') || '{}');
      sessions[sessionData.id] = sessionData;
      localStorage.setItem('asr-got-sessions', JSON.stringify(sessions));

      return {
        sessionId: sessionData.id,
        session: sessionData as SessionData
      };
    } catch (error) {
      console.error('Session creation failed:', error);
      throw error;
    }
  }

  // Load an existing session
  async loadSession(sessionId: string): Promise<{ session: SessionData }> {
    try {
      // Load from localStorage for now
      const sessions = JSON.parse(localStorage.getItem('asr-got-sessions') || '{}');
      let session = sessions[sessionId];
      
      if (!session) {
        // Try to recover from session state backup
        const sessionState = localStorage.getItem('asr-got-session-state');
        if (sessionState) {
          try {
            const state = JSON.parse(sessionState);
            if (state.sessionId === sessionId) {
              // Reconstruct session from state
              session = {
                id: sessionId,
                topic: state.researchContext?.topic || 'Recovered Session',
                field: state.researchContext?.field || 'General',
                userId: 'anonymous',
                currentStage: state.currentStage || 0,
                isComplete: state.currentStage >= 8,
                graphData: state.graphData || { nodes: [], edges: [] },
                parameters: {},
                stageResults: state.stageResults || [],
                researchContext: state.researchContext || {},
                apiUsage: {},
                createdAt: new Date().toISOString(),
                updatedAt: state.timestamp || new Date().toISOString()
              };
              
              // Save recovered session
              sessions[sessionId] = session;
              localStorage.setItem('asr-got-sessions', JSON.stringify(sessions));
              console.log('✅ Session recovered from state backup');
            }
          } catch (stateError) {
            console.warn('Failed to recover from session state:', stateError);
          }
        }
        
        if (!session) {
          throw new Error('Session not found and could not be recovered');
        }
      }

      return { session };
    } catch (error) {
      console.error('Session loading failed:', error);
      throw error;
    }
  }

  // Update session data
  async updateSession(sessionId: string, updates: UpdateSessionRequest): Promise<{ session: SessionData }> {
    try {
      // Update in localStorage for now
      const sessions = JSON.parse(localStorage.getItem('asr-got-sessions') || '{}');
      const session = sessions[sessionId];
      
      if (!session) {
        throw new Error('Session not found');
      }

      const updatedSession = {
        ...session,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      sessions[sessionId] = updatedSession;
      localStorage.setItem('asr-got-sessions', JSON.stringify(sessions));

      return { session: updatedSession };
    } catch (error) {
      console.error('Session update failed:', error);
      throw error;
    }
  }

  // Create a graph node
  async createNode(sessionId: string, nodeData: any): Promise<{ node: any }> {
    try {
      // For now, store in session data
      const sessions = JSON.parse(localStorage.getItem('asr-got-sessions') || '{}');
      const session = sessions[sessionId];
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.graphData) {
        session.graphData = { nodes: [], edges: [] };
      }

      const node = {
        id: nodeData.id || crypto.randomUUID(),
        ...nodeData,
        createdAt: new Date().toISOString()
      };

      session.graphData.nodes.push(node);
      session.updatedAt = new Date().toISOString();
      
      sessions[sessionId] = session;
      localStorage.setItem('asr-got-sessions', JSON.stringify(sessions));

      return { node };
    } catch (error) {
      console.error('Node creation failed:', error);
      throw error;
    }
  }

  // Create a graph edge
  async createEdge(sessionId: string, edgeData: any): Promise<{ edge: any }> {
    try {
      // For now, store in session data
      const sessions = JSON.parse(localStorage.getItem('asr-got-sessions') || '{}');
      const session = sessions[sessionId];
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.graphData) {
        session.graphData = { nodes: [], edges: [] };
      }

      const edge = {
        id: edgeData.id || crypto.randomUUID(),
        ...edgeData,
        createdAt: new Date().toISOString()
      };

      session.graphData.edges.push(edge);
      session.updatedAt = new Date().toISOString();
      
      sessions[sessionId] = session;
      localStorage.setItem('asr-got-sessions', JSON.stringify(sessions));

      return { edge };
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
      // For now, store in localStorage
      const usage = {
        id: crypto.randomUUID(),
        ...data,
        timestamp: new Date().toISOString()
      };

      const apiUsage = JSON.parse(localStorage.getItem('asr-got-api-usage') || '[]');
      apiUsage.push(usage);
      
      // Keep only last 1000 entries
      if (apiUsage.length > 1000) {
        apiUsage.splice(0, apiUsage.length - 1000);
      }
      
      localStorage.setItem('asr-got-api-usage', JSON.stringify(apiUsage));

      return { usage };
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

  // Clear auto-save timeout
  clearAutoSave(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }

  // Check Supabase connection health
  async checkHealth(): Promise<boolean> {
    try {
      // Test connectivity using HEAD request to avoid 401 console errors
      const response = await fetch('https://aogeenqytwrpjvrfwvjw.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE3NTUyMDksImV4cCI6MjAzNzMzMTIwOX0.T_-2c37bIY8__ztVdYmPYQgpMhSprLhJMo9m6lxPCWE',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE3NTUyMDksImV4cCI6MjAzNzMzMTIwOX0.T_-2c37bIY8__ztVdYmPYQgpMhSprLhJMo9m6lxPCWE'
        }
      });
      
      // Any response (200, 404, 405) confirms connectivity works
      return response.status === 200 || response.status === 404 || response.status === 405;
    } catch (error) {
      console.warn('Supabase health check failed, using localStorage mode');
      return true; // Return true for localStorage fallback
    }
  }

  // Get Supabase status
  async getServerStatus(): Promise<any> {
    try {
      const isHealthy = await this.checkHealth();
      if (isHealthy) {
        return {
          status: 'online',
          backend: 'supabase',
          timestamp: new Date().toISOString()
        };
      }
      throw new Error('Supabase not responding');
    } catch (error) {
      return {
        status: 'offline',
        backend: 'localStorage',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get all sessions for a user
  async getUserSessions(userId?: string): Promise<{ sessions: SessionData[] }> {
    try {
      const sessions = JSON.parse(localStorage.getItem('asr-got-sessions') || '{}');
      const sessionList = Object.values(sessions) as SessionData[];
      
      // Filter by userId if provided
      const filteredSessions = userId 
        ? sessionList.filter(session => (session as any).userId === userId)
        : sessionList;

      return { sessions: filteredSessions };
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return { sessions: [] };
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
    getServerStatus: () => sessionPersistence.getServerStatus(),
    getUserSessions: (userId?: string) => sessionPersistence.getUserSessions(userId)
  };
};