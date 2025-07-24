/**
 * SECURE DATA SERVICE
 * Provides secure, authorization-checked database access
 * 
 * ALL DATABASE ACCESS SHOULD GO THROUGH THIS SERVICE
 */

import { supabase } from '@/integrations/supabase/client';
import { AuthorizationService } from './AuthorizationService';

export class SecureDataService {
  
  /**
   * Get session data with authorization check
   */
  static async getSessionData(sessionId: string) {
    // Verify user owns the session
    const hasAccess = await AuthorizationService.verifyQuerySessionOwnership(sessionId) ||
                     await AuthorizationService.verifyResearchSessionOwnership(sessionId);
    
    if (!hasAccess) {
      throw new Error(`❌ SECURITY: Unauthorized access to session ${sessionId}`);
    }

    return { sessionId, authorized: true };
  }

  /**
   * Get query figures with authorization
   */
  static async getQueryFigures(sessionId: string) {
    await this.getSessionData(sessionId);
    
    const { data, error } = await supabase
      .from('query_figures')
      .select('*')
      .eq('session_id', sessionId)
      .order('stage', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get query tables with authorization
   */
  static async getQueryTables(sessionId: string) {
    await this.getSessionData(sessionId);
    
    const { data, error } = await supabase
      .from('query_tables')
      .select('*')
      .eq('session_id', sessionId)
      .order('stage', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get stage executions with authorization
   */
  static async getStageExecutions(sessionId: string) {
    await this.getSessionData(sessionId);
    
    const { data, error } = await supabase
      .from('stage_executions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get graph data with authorization
   */
  static async getGraphData(sessionId: string) {
    await this.getSessionData(sessionId);
    
    const { data, error } = await supabase
      .from('graph_data')
      .select('*')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Insert data with automatic user_id assignment
   */
  static async insertWithUser(table: string, data: any) {
    const user = await AuthorizationService.requireAuthentication();
    
    const insertData = {
      ...data,
      user_id: user.id
    };

    const { data: result, error } = await supabase
      .from(table)
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Update data with ownership verification
   */
  static async updateWithAuth(table: string, id: string, data: any) {
    const user = await AuthorizationService.requireAuthentication();
    
    // First verify the record belongs to the user
    const { data: existing, error: checkError } = await supabase
      .from(table)
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError) throw checkError;
    if (!existing || existing.user_id !== user.id) {
      throw new Error(`❌ SECURITY: Cannot update record ${id} - not owned by user`);
    }

    // Perform the update
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)  // Double-check ownership in update
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Delete data with ownership verification
   */
  static async deleteWithAuth(table: string, id: string) {
    const user = await AuthorizationService.requireAuthentication();
    
    // First verify the record belongs to the user
    const { data: existing, error: checkError } = await supabase
      .from(table)
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError) throw checkError;
    if (!existing || existing.user_id !== user.id) {
      throw new Error(`❌ SECURITY: Cannot delete record ${id} - not owned by user`);
    }

    // Perform the deletion
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);  // Double-check ownership in delete

    if (error) throw error;
    return true;
  }

  /**
   * Get user's own records only
   */
  static async getUserRecords(table: string, filters: any = {}) {
    const user = await AuthorizationService.requireAuthentication();
    
    let query = supabase
      .from(table)
      .select('*')
      .eq('user_id', user.id);

    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Export session data with full authorization
   */
  static async exportSessionSecure(sessionId: string) {
    console.log(`🔒 Secure export for session: ${sessionId}`);
    
    // Verify authorization first
    await this.getSessionData(sessionId);
    
    // Get all related data securely
    const [session, figures, tables, stageExecutions, graphData] = await Promise.all([
      this.getSessionBasicInfo(sessionId),
      this.getQueryFigures(sessionId),
      this.getQueryTables(sessionId),
      this.getStageExecutions(sessionId),
      this.getGraphData(sessionId)
    ]);

    return {
      session,
      figures,
      tables,
      stage_executions: stageExecutions,
      graph_data: graphData,
      exported_at: new Date().toISOString(),
      security_note: 'This export was generated with full authorization verification'
    };
  }

  /**
   * Get basic session info (internal helper)
   */
  private static async getSessionBasicInfo(sessionId: string) {
    const user = await AuthorizationService.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    // Try query_sessions first
    const { data: querySession, error: queryError } = await supabase
      .from('query_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (!queryError && querySession) {
      return querySession;
    }

    // Try research_sessions
    const { data: researchSession, error: researchError } = await supabase
      .from('research_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (researchError || !researchSession) {
      throw new Error(`Session ${sessionId} not found or access denied`);
    }

    return researchSession;
  }
}

// Export for easy access
export const secureData = SecureDataService;