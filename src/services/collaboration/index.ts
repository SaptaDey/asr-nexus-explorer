/**
 * Collaboration Services Export Index
 * Central export point for all collaboration-related services and hooks
 */

// Core collaboration service
export { CollaborationService, collaborationService } from './CollaborationService';

// React hooks
export { 
  useCollaboration, 
  useCollaborationInvitations, 
  useCursorTracking 
} from '@/hooks/useCollaboration';

// Type exports
export type {
  CollaborationInvite,
  CollaborationPermissions,
  RealtimeUpdate,
  Comment,
  UserPresence
} from './CollaborationService';