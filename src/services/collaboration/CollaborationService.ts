/**
 * Real-time Collaboration Service for ASR-GoT Framework
 * Enables real-time collaborative research with Supabase
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { DatabaseService } from '../database/DatabaseService';
import { 
  CollaborationData, 
  CollaborationUser, 
  PresenceState, 
  DatabaseUpdateEvent,
  PresenceEvent,
  ActivityData 
} from '@/types/improvedTypes';

export interface CollaborationInvite {
  id: string;
  session_id: string;
  collaborator_id: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  invited_by: string;
  invited_at: string;
  accepted_at?: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
}

export interface CollaborationPermissions {
  canEdit: boolean;
  canComment: boolean;
  canInvite: boolean;
  canManageRoles: boolean;
  canExport: boolean;
  canDelete: boolean;
}

export interface RealtimeUpdate {
  type: 'graph_update' | 'stage_update' | 'hypothesis_update' | 'comment_added' | 'user_joined' | 'user_left';
  data: Record<string, unknown>;
  user_id: string;
  timestamp: string;
  session_id: string;
}

export interface Comment {
  id: string;
  session_id: string;
  user_id: string;
  target_type: 'node' | 'edge' | 'stage' | 'hypothesis' | 'general';
  target_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

export interface UserPresence {
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'offline';
  current_stage?: number;
  last_seen: string;
  cursor_position?: { x: number; y: number };
}

export class CollaborationService {
  private supabase: SupabaseClient;
  private db: DatabaseService;
  private channels: Map<string, RealtimeChannel> = new Map();
  private presenceUpdateInterval: NodeJS.Timeout | null = null;
  private currentPresence: UserPresence | null = null;

  // Event callbacks
  private onUpdate?: (update: RealtimeUpdate) => void;
  private onPresenceChange?: (presences: UserPresence[]) => void;
  private onCommentAdded?: (comment: Comment) => void;
  private onPermissionChanged?: (permissions: CollaborationPermissions) => void;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.db = new DatabaseService();
  }

  /**
   * Join a collaborative session
   */
  async joinSession(
    sessionId: string,
    callbacks: {
      onUpdate?: (update: RealtimeUpdate) => void;
      onPresenceChange?: (presences: UserPresence[]) => void;
      onCommentAdded?: (comment: Comment) => void;
      onPermissionChanged?: (permissions: CollaborationPermissions) => void;
    }
  ): Promise<{
    permissions: CollaborationPermissions;
    collaborators: CollaborationUser[];
    currentPresences: UserPresence[];
  }> {
    try {
      // Set callbacks
      this.onUpdate = callbacks.onUpdate;
      this.onPresenceChange = callbacks.onPresenceChange;
      this.onCommentAdded = callbacks.onCommentAdded;
      this.onPermissionChanged = callbacks.onPermissionChanged;

      // Get user and permissions
      const user = await this.db.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const permissions = await this.getUserPermissions(sessionId, user.id);
      const collaborators = await this.getCollaborators(sessionId);

      // Set up real-time channels
      await this.setupRealtimeChannels(sessionId);

      // Initialize user presence
      await this.initializePresence(sessionId, user.id);

      // Get current presences
      const currentPresences = await this.getCurrentPresences(sessionId);

      // Log activity
      await this.logActivity(sessionId, user.id, 'user_joined', {
        timestamp: new Date().toISOString()
      });

      return {
        permissions,
        collaborators,
        currentPresences
      };

    } catch (error) {
      console.error('Failed to join session:', error);
      throw error;
    }
  }

  /**
   * Leave a collaborative session
   */
  async leaveSession(sessionId: string): Promise<void> {
    try {
      const user = await this.db.getCurrentUser();
      if (user) {
        // Update presence to offline
        await this.updatePresence(sessionId, user.id, {
          status: 'offline',
          last_seen: new Date().toISOString()
        });

        // Log activity
        await this.logActivity(sessionId, user.id, 'user_left', {
          timestamp: new Date().toISOString()
        });
      }

      // Clean up channels
      await this.cleanupChannels(sessionId);

      // Stop presence updates
      if (this.presenceUpdateInterval) {
        clearInterval(this.presenceUpdateInterval);
        this.presenceUpdateInterval = null;
      }

    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  }

  /**
   * Invite a collaborator to a session
   */
  async inviteCollaborator(
    sessionId: string,
    email: string,
    role: 'editor' | 'viewer' | 'commenter'
  ): Promise<CollaborationInvite> {
    try {
      const user = await this.db.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Check permission to invite
      const permissions = await this.getUserPermissions(sessionId, user.id);
      if (!permissions.canInvite) {
        throw new Error('Insufficient permissions to invite collaborators');
      }

      // Find user by email
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        throw new Error('User not found');
      }

      // Create invitation
      const { data: invitation, error } = await this.supabase
        .from('research_collaborations')
        .insert({
          session_id: sessionId,
          collaborator_id: profile.id,
          role,
          invited_by: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification (could be enhanced with email service)
      await this.sendInvitationNotification(sessionId, profile.id, user.id, role);

      return invitation;

    } catch (error) {
      console.error('Failed to invite collaborator:', error);
      throw error;
    }
  }

  /**
   * Respond to collaboration invitation
   */
  async respondToInvitation(
    invitationId: string,
    response: 'accepted' | 'declined'
  ): Promise<CollaborationInvite> {
    try {
      const user = await this.db.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const updates: Record<string, unknown> = {
        status: response
      };

      if (response === 'accepted') {
        updates.accepted_at = new Date().toISOString();
      }

      const { data: invitation, error } = await this.supabase
        .from('research_collaborations')
        .update(updates)
        .eq('id', invitationId)
        .eq('collaborator_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(invitation.session_id, user.id, `invitation_${response}`, {
        invitation_id: invitationId,
        role: invitation.role
      });

      return invitation;

    } catch (error) {
      console.error('Failed to respond to invitation:', error);
      throw error;
    }
  }

  /**
   * Update collaborator role
   */
  async updateCollaboratorRole(
    sessionId: string,
    collaboratorId: string,
    newRole: 'editor' | 'viewer' | 'commenter'
  ): Promise<CollaborationInvite> {
    try {
      const user = await this.db.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Check permission to manage roles
      const permissions = await this.getUserPermissions(sessionId, user.id);
      if (!permissions.canManageRoles) {
        throw new Error('Insufficient permissions to manage roles');
      }

      const { data: collaboration, error } = await this.supabase
        .from('research_collaborations')
        .update({ role: newRole })
        .eq('session_id', sessionId)
        .eq('collaborator_id', collaboratorId)
        .select()
        .single();

      if (error) throw error;

      // Notify affected user of role change
      await this.notifyPermissionChange(sessionId, collaboratorId, newRole);

      return collaboration;

    } catch (error) {
      console.error('Failed to update collaborator role:', error);
      throw error;
    }
  }

  /**
   * Remove collaborator from session
   */
  async removeCollaborator(sessionId: string, collaboratorId: string): Promise<void> {
    try {
      const user = await this.db.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Check permission to manage roles
      const permissions = await this.getUserPermissions(sessionId, user.id);
      if (!permissions.canManageRoles) {
        throw new Error('Insufficient permissions to remove collaborators');
      }

      // Remove collaboration
      const { error } = await this.supabase
        .from('research_collaborations')
        .delete()
        .eq('session_id', sessionId)
        .eq('collaborator_id', collaboratorId);

      if (error) throw error;

      // Log activity
      await this.logActivity(sessionId, user.id, 'collaborator_removed', {
        removed_user_id: collaboratorId
      });

    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      throw error;
    }
  }

  /**
   * Add comment to session
   */
  async addComment(
    sessionId: string,
    targetType: 'node' | 'edge' | 'stage' | 'hypothesis' | 'general',
    content: string,
    targetId?: string
  ): Promise<Comment> {
    try {
      const user = await this.db.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Check comment permission
      const permissions = await this.getUserPermissions(sessionId, user.id);
      if (!permissions.canComment) {
        throw new Error('Insufficient permissions to add comments');
      }

      // Insert comment into activity logs (using activity logs as comments table)
      const comment = await this.logActivity(sessionId, user.id, 'comment_added', {
        target_type: targetType,
        target_id: targetId,
        content,
        timestamp: new Date().toISOString()
      });

      // Notify collaborators
      this.broadcastUpdate(sessionId, {
        type: 'comment_added',
        data: comment,
        user_id: user.id,
        timestamp: new Date().toISOString(),
        session_id: sessionId
      });

      return {
        id: comment.id,
        session_id: sessionId,
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        content,
        created_at: comment.created_at,
        updated_at: comment.created_at
      };

    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for session
   */
  async getComments(
    sessionId: string,
    targetType?: string,
    targetId?: string
  ): Promise<Comment[]> {
    try {
      let query = this.supabase
        .from('activity_logs')
        .select('*, profiles!activity_logs_user_id_fkey(full_name, avatar_url)')
        .eq('session_id', sessionId)
        .eq('activity_type', 'comment_added');

      if (targetType) {
        query = query.eq('activity_data->target_type', targetType);
      }

      if (targetId) {
        query = query.eq('activity_data->target_id', targetId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(log => ({
        id: log.id,
        session_id: log.session_id,
        user_id: log.user_id,
        target_type: log.activity_data.target_type,
        target_id: log.activity_data.target_id,
        content: log.activity_data.content,
        created_at: log.created_at,
        updated_at: log.created_at
      }));

    } catch (error) {
      console.error('Failed to get comments:', error);
      return [];
    }
  }

  /**
   * Broadcast real-time update to all session participants
   */
  async broadcastUpdate(sessionId: string, update: Omit<RealtimeUpdate, 'session_id'>): Promise<void> {
    try {
      const channel = this.channels.get(`session_${sessionId}`);
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'collaboration_update',
          payload: { ...update, session_id: sessionId }
        });
      }
    } catch (error) {
      console.error('Failed to broadcast update:', error);
    }
  }

  /**
   * Update user presence
   */
  async updatePresence(
    sessionId: string,
    userId: string,
    updates: Partial<UserPresence>
  ): Promise<void> {
    try {
      const channel = this.channels.get(`presence_${sessionId}`);
      if (channel) {
        const updatedPresence = { ...this.currentPresence, ...updates };
        this.currentPresence = updatedPresence;
        
        await channel.track(updatedPresence);
      }
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }

  /**
   * Get user permissions for session
   */
  async getUserPermissions(sessionId: string, userId: string): Promise<CollaborationPermissions> {
    try {
      // Check if user is session owner
      const { data: session, error: sessionError } = await this.supabase
        .from('research_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      if (session.user_id === userId) {
        // Session owner has all permissions
        return {
          canEdit: true,
          canComment: true,
          canInvite: true,
          canManageRoles: true,
          canExport: true,
          canDelete: true
        };
      }

      // Check collaboration role
      const { data: collaboration, error: collabError } = await this.supabase
        .from('research_collaborations')
        .select('role')
        .eq('session_id', sessionId)
        .eq('collaborator_id', userId)
        .eq('status', 'accepted')
        .single();

      if (collabError || !collaboration) {
        // No access
        return {
          canEdit: false,
          canComment: false,
          canInvite: false,
          canManageRoles: false,
          canExport: false,
          canDelete: false
        };
      }

      // Set permissions based on role
      switch (collaboration.role) {
        case 'editor':
          return {
            canEdit: true,
            canComment: true,
            canInvite: true,
            canManageRoles: false,
            canExport: true,
            canDelete: false
          };
        case 'viewer':
          return {
            canEdit: false,
            canComment: false,
            canInvite: false,
            canManageRoles: false,
            canExport: true,
            canDelete: false
          };
        case 'commenter':
          return {
            canEdit: false,
            canComment: true,
            canInvite: false,
            canManageRoles: false,
            canExport: false,
            canDelete: false
          };
        default:
          return {
            canEdit: false,
            canComment: false,
            canInvite: false,
            canManageRoles: false,
            canExport: false,
            canDelete: false
          };
      }

    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return {
        canEdit: false,
        canComment: false,
        canInvite: false,
        canManageRoles: false,
        canExport: false,
        canDelete: false
      };
    }
  }

  /**
   * Private helper methods
   */
  private async setupRealtimeChannels(sessionId: string): Promise<void> {
    // Session updates channel
    const sessionChannel = this.supabase
      .channel(`session_${sessionId}`)
      .on('broadcast', { event: 'collaboration_update' }, (payload) => {
        if (this.onUpdate) {
          this.onUpdate(payload.payload as RealtimeUpdate);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'research_sessions',
        filter: `id=eq.${sessionId}`
      }, (payload) => {
        this.handleDatabaseUpdate(sessionId, 'session', payload);
      })
      .subscribe();

    this.channels.set(`session_${sessionId}`, sessionChannel);

    // Presence channel
    const presenceChannel = this.supabase
      .channel(`presence_${sessionId}`)
      .on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync(sessionId);
      })
      .on('presence', { event: 'join' }, (payload) => {
        this.handlePresenceJoin(sessionId, payload);
      })
      .on('presence', { event: 'leave' }, (payload) => {
        this.handlePresenceLeave(sessionId, payload);
      })
      .subscribe();

    this.channels.set(`presence_${sessionId}`, presenceChannel);

    // Graph changes channel
    const graphChannel = this.supabase
      .channel(`graph_${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'graph_nodes',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        this.handleDatabaseUpdate(sessionId, 'graph_node', payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'graph_edges',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        this.handleDatabaseUpdate(sessionId, 'graph_edge', payload);
      })
      .subscribe();

    this.channels.set(`graph_${sessionId}`, graphChannel);
  }

  private async cleanupChannels(sessionId: string): Promise<void> {
    const channelKeys = [
      `session_${sessionId}`,
      `presence_${sessionId}`,
      `graph_${sessionId}`
    ];

    for (const key of channelKeys) {
      const channel = this.channels.get(key);
      if (channel) {
        await channel.unsubscribe();
        this.channels.delete(key);
      }
    }
  }

  private async initializePresence(sessionId: string, userId: string): Promise<void> {
    const user = await this.db.getProfile(userId);
    
    this.currentPresence = {
      user_id: userId,
      full_name: user?.full_name,
      avatar_url: user?.avatar_url,
      status: 'online',
      last_seen: new Date().toISOString()
    };

    // Set up presence update interval
    this.presenceUpdateInterval = setInterval(async () => {
      if (this.currentPresence) {
        await this.updatePresence(sessionId, userId, {
          last_seen: new Date().toISOString()
        });
      }
    }, 30000); // Update every 30 seconds
  }

  private async getCurrentPresences(sessionId: string): Promise<UserPresence[]> {
    const channel = this.channels.get(`presence_${sessionId}`);
    if (!channel) return [];

    const presenceState = channel.presenceState();
    const presences: UserPresence[] = [];

    Object.values(presenceState).forEach((presence: PresenceState) => {
      if (presence[0]) {
        presences.push(presence[0] as UserPresence);
      }
    });

    return presences;
  }

  private async getCollaborators(sessionId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('research_collaborations')
      .select(`
        *,
        profiles!research_collaborations_collaborator_id_fkey(
          id, full_name, avatar_url, email
        )
      `)
      .eq('session_id', sessionId)
      .eq('status', 'accepted');

    if (error) throw error;
    return data || [];
  }

  private async logActivity(
    sessionId: string,
    userId: string,
    activityType: string,
    activityData: ActivityData
  ): Promise<any> {
    const { data, error } = await this.supabase
      .from('activity_logs')
      .insert({
        session_id: sessionId,
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private handleDatabaseUpdate(sessionId: string, type: string, payload: DatabaseUpdateEvent['payload']): void {
    if (this.onUpdate) {
      this.onUpdate({
        type: `${type}_update` as any,
        data: payload,
        user_id: 'system',
        timestamp: new Date().toISOString(),
        session_id: sessionId
      });
    }
  }

  private handlePresenceSync(sessionId: string): void {
    if (this.onPresenceChange) {
      this.getCurrentPresences(sessionId).then(presences => {
        this.onPresenceChange!(presences);
      });
    }
  }

  private handlePresenceJoin(sessionId: string, payload: PresenceEvent['payload']): void {
    console.log('User joined:', payload);
    this.handlePresenceSync(sessionId);
  }

  private handlePresenceLeave(sessionId: string, payload: PresenceEvent['payload']): void {
    console.log('User left:', payload);
    this.handlePresenceSync(sessionId);
  }

  private async sendInvitationNotification(
    sessionId: string,
    collaboratorId: string,
    invitedBy: string,
    role: string
  ): Promise<void> {
    // Could be enhanced with email service or push notifications
    await this.logActivity(sessionId, collaboratorId, 'invitation_received', {
      invited_by: invitedBy,
      role,
      timestamp: new Date().toISOString()
    });
  }

  private async notifyPermissionChange(
    sessionId: string,
    userId: string,
    newRole: string
  ): Promise<void> {
    const permissions = await this.getUserPermissions(sessionId, userId);
    
    if (this.onPermissionChanged) {
      this.onPermissionChanged(permissions);
    }

    await this.logActivity(sessionId, userId, 'role_updated', {
      new_role: newRole,
      timestamp: new Date().toISOString()
    });
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();