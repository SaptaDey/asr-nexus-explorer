/**
 * CRITICAL AUTHORIZATION SERVICE
 * Prevents unauthorized access to user data
 * 
 * THIS FIXES TASK #41: Authorization bypass in direct database access
 */

import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export class AuthorizationService {
  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('Authorization check failed:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.error('Critical auth error:', error);
      return null;
    }
  }

  /**
   * Verify current user is authenticated
   */
  static async requireAuthentication(): Promise<User> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('Authentication required: User must be logged in');
    }
    return user;
  }

  /**
   * Verify user owns a query session
   */
  static async verifyQuerySessionOwnership(sessionId: string, userId?: string): Promise<boolean> {
    try {
      // If no userId provided, get current user
      if (!userId) {
        const user = await this.getCurrentUser();
        if (!user) return false;
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('query_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

      if (error || !data) {
        console.warn(`Session ${sessionId} not found or access denied`);
        return false;
      }

      return data.user_id === userId;
    } catch (error) {
      console.error('Session ownership verification failed:', error);
      return false;
    }
  }

  /**
   * Verify user owns a research session
   */
  static async verifyResearchSessionOwnership(sessionId: string, userId?: string): Promise<boolean> {
    try {
      // If no userId provided, get current user
      if (!userId) {
        const user = await this.getCurrentUser();
        if (!user) return false;
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('research_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

      if (error || !data) {
        console.warn(`Research session ${sessionId} not found or access denied`);
        return false;
      }

      return data.user_id === userId;
    } catch (error) {
      console.error('Research session ownership verification failed:', error);
      return false;
    }
  }

  /**
   * Get query sessions for current user only
   */
  static async getUserQuerySessions(filters: any = {}) {
    const user = await this.requireAuthentication();
    
    let query = supabase
      .from('query_sessions')
      .select('*')
      .eq('user_id', user.id);  // CRITICAL: Only user's own sessions

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.searchTerm) {
      query = query.ilike('query', `%${filters.searchTerm}%`);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    return query;
  }

  /**
   * Get research sessions for current user only
   */
  static async getUserResearchSessions(filters: any = {}) {
    const user = await this.requireAuthentication();
    
    let query = supabase
      .from('research_sessions')
      .select('*')
      .eq('user_id', user.id);  // CRITICAL: Only user's own sessions

    // Apply filters similarly to query sessions
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    return query;
  }

  /**
   * Get session-related data with authorization
   */
  static async getAuthorizedSessionData(sessionId: string, table: string) {
    // First verify session ownership
    const isQuerySession = await this.verifyQuerySessionOwnership(sessionId);
    const isResearchSession = await this.verifyResearchSessionOwnership(sessionId);
    
    if (!isQuerySession && !isResearchSession) {
      throw new Error(`Unauthorized: Access denied to session ${sessionId}`);
    }

    // Get the data
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('session_id', sessionId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Secure query builder that always includes user authorization
   */
  static async secureQuery(table: string, userId?: string) {
    if (!userId) {
      const user = await this.requireAuthentication();
      userId = user.id;
    }

    // For user-owned tables, always filter by user_id
    if (['query_sessions', 'research_sessions', 'profiles'].includes(table)) {
      return supabase.from(table).select('*').eq('user_id', userId);
    }

    // For session-related tables, we need to join with session tables for authorization
    if (['query_figures', 'query_tables'].includes(table)) {
      return supabase
        .from(table)
        .select(`
          *,
          query_sessions!inner(user_id)
        `)
        .eq('query_sessions.user_id', userId);
    }

    if (['graph_data', 'stage_executions'].includes(table)) {
      return supabase
        .from(table)
        .select(`
          *,
          research_sessions!inner(user_id)
        `)
        .eq('research_sessions.user_id', userId);
    }

    throw new Error(`Unauthorized table access: ${table}`);
  }

  /**
   * Validate that a user can perform an action on a resource
   */
  static async validateResourceAccess(
    resourceType: 'query_session' | 'research_session' | 'profile',
    resourceId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      switch (resourceType) {
        case 'query_session':
          return await this.verifyQuerySessionOwnership(resourceId, user.id);
        case 'research_session':
          return await this.verifyResearchSessionOwnership(resourceId, user.id);
        case 'profile':
          // Check if trying to access own profile
          const { data } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('id', resourceId)
            .single();
          return data?.user_id === user.id;
        default:
          return false;
      }
    } catch (error) {
      console.error('Resource access validation failed:', error);
      return false;
    }
  }
}

// Export static methods for convenience
export const {
  getCurrentUser,
  requireAuthentication,
  verifyQuerySessionOwnership,
  verifyResearchSessionOwnership,
  getUserQuerySessions,
  getUserResearchSessions,
  getAuthorizedSessionData,
  secureQuery,
  validateResourceAccess
} = AuthorizationService;