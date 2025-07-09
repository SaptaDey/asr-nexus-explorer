/**
 * React Hook for Real-time Collaboration
 * Provides easy integration of collaboration features in React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CollaborationService, 
  CollaborationPermissions, 
  UserPresence, 
  RealtimeUpdate, 
  Comment 
} from '@/services/collaboration/CollaborationService';

interface UseCollaborationParams {
  sessionId: string;
  enabled?: boolean;
}

interface UseCollaborationReturn {
  // State
  isConnected: boolean;
  permissions: CollaborationPermissions;
  collaborators: any[];
  presences: UserPresence[];
  comments: Comment[];
  loading: boolean;
  error: string | null;

  // Actions
  inviteCollaborator: (email: string, role: 'editor' | 'viewer' | 'commenter') => Promise<void>;
  updateCollaboratorRole: (collaboratorId: string, role: 'editor' | 'viewer' | 'commenter') => Promise<void>;
  removeCollaborator: (collaboratorId: string) => Promise<void>;
  addComment: (targetType: 'node' | 'edge' | 'stage' | 'hypothesis' | 'general', content: string, targetId?: string) => Promise<void>;
  broadcastUpdate: (type: RealtimeUpdate['type'], data: any) => Promise<void>;
  updatePresence: (updates: Partial<UserPresence>) => Promise<void>;

  // Callbacks
  onUpdate: (callback: (update: RealtimeUpdate) => void) => () => void;
  onPresenceChange: (callback: (presences: UserPresence[]) => void) => () => void;
  onCommentAdded: (callback: (comment: Comment) => void) => () => void;
}

export function useCollaboration({ 
  sessionId, 
  enabled = true 
}: UseCollaborationParams): UseCollaborationReturn {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [permissions, setPermissions] = useState<CollaborationPermissions>({
    canEdit: false,
    canComment: false,
    canInvite: false,
    canManageRoles: false,
    canExport: false,
    canDelete: false
  });
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Service reference
  const collaborationService = useRef(new CollaborationService());
  
  // Callback refs for external event handlers
  const updateCallbacks = useRef<Set<(update: RealtimeUpdate) => void>>(new Set());
  const presenceCallbacks = useRef<Set<(presences: UserPresence[]) => void>>(new Set());
  const commentCallbacks = useRef<Set<(comment: Comment) => void>>(new Set());

  /**
   * Initialize collaboration session
   */
  useEffect(() => {
    if (!enabled || !sessionId) return;

    let mounted = true;

    const initializeSession = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await collaborationService.current.joinSession(sessionId, {
          onUpdate: (update) => {
            updateCallbacks.current.forEach(callback => callback(update));
          },
          onPresenceChange: (newPresences) => {
            if (mounted) {
              setPresences(newPresences);
              presenceCallbacks.current.forEach(callback => callback(newPresences));
            }
          },
          onCommentAdded: (comment) => {
            if (mounted) {
              setComments(prev => [...prev, comment]);
              commentCallbacks.current.forEach(callback => callback(comment));
            }
          },
          onPermissionChanged: (newPermissions) => {
            if (mounted) {
              setPermissions(newPermissions);
            }
          }
        });

        if (mounted) {
          setPermissions(result.permissions);
          setCollaborators(result.collaborators);
          setPresences(result.currentPresences);
          setIsConnected(true);
        }

        // Load existing comments
        const existingComments = await collaborationService.current.getComments(sessionId);
        if (mounted) {
          setComments(existingComments);
        }

      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize collaboration');
          setIsConnected(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeSession();

    // Cleanup on unmount
    return () => {
      mounted = false;
      collaborationService.current.leaveSession(sessionId).catch(console.error);
    };
  }, [sessionId, enabled]);

  /**
   * Invite collaborator
   */
  const inviteCollaborator = useCallback(async (
    email: string, 
    role: 'editor' | 'viewer' | 'commenter'
  ) => {
    try {
      setError(null);
      const invitation = await collaborationService.current.inviteCollaborator(sessionId, email, role);
      
      // Refresh collaborators list
      const updatedCollaborators = await collaborationService.current['getCollaborators'](sessionId);
      setCollaborators(updatedCollaborators);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite collaborator');
      throw err;
    }
  }, [sessionId]);

  /**
   * Update collaborator role
   */
  const updateCollaboratorRole = useCallback(async (
    collaboratorId: string, 
    role: 'editor' | 'viewer' | 'commenter'
  ) => {
    try {
      setError(null);
      await collaborationService.current.updateCollaboratorRole(sessionId, collaboratorId, role);
      
      // Refresh collaborators list
      const updatedCollaborators = await collaborationService.current['getCollaborators'](sessionId);
      setCollaborators(updatedCollaborators);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update collaborator role');
      throw err;
    }
  }, [sessionId]);

  /**
   * Remove collaborator
   */
  const removeCollaborator = useCallback(async (collaboratorId: string) => {
    try {
      setError(null);
      await collaborationService.current.removeCollaborator(sessionId, collaboratorId);
      
      // Refresh collaborators list
      const updatedCollaborators = await collaborationService.current['getCollaborators'](sessionId);
      setCollaborators(updatedCollaborators);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove collaborator');
      throw err;
    }
  }, [sessionId]);

  /**
   * Add comment
   */
  const addComment = useCallback(async (
    targetType: 'node' | 'edge' | 'stage' | 'hypothesis' | 'general',
    content: string,
    targetId?: string
  ) => {
    try {
      setError(null);
      const comment = await collaborationService.current.addComment(sessionId, targetType, content, targetId);
      // Comment will be added to state via the onCommentAdded callback
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      throw err;
    }
  }, [sessionId]);

  /**
   * Broadcast update
   */
  const broadcastUpdate = useCallback(async (
    type: RealtimeUpdate['type'], 
    data: any
  ) => {
    try {
      setError(null);
      await collaborationService.current.broadcastUpdate(sessionId, {
        type,
        data,
        user_id: 'current_user', // Will be set by the service
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to broadcast update');
      throw err;
    }
  }, [sessionId]);

  /**
   * Update user presence
   */
  const updatePresence = useCallback(async (updates: Partial<UserPresence>) => {
    try {
      setError(null);
      await collaborationService.current.updatePresence(sessionId, 'current_user', updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update presence');
      throw err;
    }
  }, [sessionId]);

  /**
   * Register update callback
   */
  const onUpdate = useCallback((callback: (update: RealtimeUpdate) => void) => {
    updateCallbacks.current.add(callback);
    
    return () => {
      updateCallbacks.current.delete(callback);
    };
  }, []);

  /**
   * Register presence change callback
   */
  const onPresenceChange = useCallback((callback: (presences: UserPresence[]) => void) => {
    presenceCallbacks.current.add(callback);
    
    return () => {
      presenceCallbacks.current.delete(callback);
    };
  }, []);

  /**
   * Register comment added callback
   */
  const onCommentAdded = useCallback((callback: (comment: Comment) => void) => {
    commentCallbacks.current.add(callback);
    
    return () => {
      commentCallbacks.current.delete(callback);
    };
  }, []);

  return {
    // State
    isConnected,
    permissions,
    collaborators,
    presences,
    comments,
    loading,
    error,

    // Actions
    inviteCollaborator,
    updateCollaboratorRole,
    removeCollaborator,
    addComment,
    broadcastUpdate,
    updatePresence,

    // Callbacks
    onUpdate,
    onPresenceChange,
    onCommentAdded
  };
}

/**
 * Hook for managing collaboration invitations
 */
export function useCollaborationInvitations() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const collaborationService = useRef(new CollaborationService());

  /**
   * Load user's pending invitations
   */
  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // This would need to be implemented in the collaboration service
      // For now, we'll use a placeholder
      const pendingInvitations: any[] = [];
      setInvitations(pendingInvitations);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Respond to invitation
   */
  const respondToInvitation = useCallback(async (
    invitationId: string,
    response: 'accepted' | 'declined'
  ) => {
    try {
      setError(null);
      await collaborationService.current.respondToInvitation(invitationId, response);
      
      // Refresh invitations
      await loadInvitations();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond to invitation');
      throw err;
    }
  }, [loadInvitations]);

  // Load invitations on mount
  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  return {
    invitations,
    loading,
    error,
    loadInvitations,
    respondToInvitation
  };
}

/**
 * Hook for real-time cursor tracking
 */
export function useCursorTracking(sessionId: string, enabled = true) {
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number; user: UserPresence }>>({});
  const collaborationService = useRef(new CollaborationService());

  /**
   * Update current user's cursor position
   */
  const updateCursor = useCallback((x: number, y: number) => {
    if (!enabled) return;
    
    collaborationService.current.updatePresence(sessionId, 'current_user', {
      cursor_position: { x, y }
    }).catch(console.error);
  }, [sessionId, enabled]);

  /**
   * Handle presence changes to update cursor positions
   */
  useEffect(() => {
    if (!enabled) return;

    // This would integrate with the collaboration service's presence updates
    // For now, it's a placeholder for the cursor tracking functionality

  }, [sessionId, enabled]);

  return {
    cursors,
    updateCursor
  };
}