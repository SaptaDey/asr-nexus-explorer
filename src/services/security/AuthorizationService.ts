/**
 * Authorization Service with Role-Based Access Control (RBAC)
 * Provides comprehensive authorization and permission management for ASR-GoT framework
 */

import { supabase } from '@/integrations/supabase/client';
import { securityLogger, SecurityEventType, SecurityEventSeverity } from '../securityEventLogger';
import type { User } from '@supabase/supabase-js';

// Role definitions
export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  RESEARCHER = 'researcher',
  COLLABORATOR = 'collaborator',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Permission definitions
export enum Permission {
  // Session permissions
  CREATE_SESSION = 'create_session',
  READ_SESSION = 'read_session',
  UPDATE_SESSION = 'update_session',
  DELETE_SESSION = 'delete_session',
  SHARE_SESSION = 'share_session',
  
  // Data permissions
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data',
  BACKUP_DATA = 'backup_data',
  
  // API permissions
  USE_GEMINI_API = 'use_gemini_api',
  USE_PERPLEXITY_API = 'use_perplexity_api',
  MANAGE_API_KEYS = 'manage_api_keys',
  
  // Collaboration permissions
  INVITE_COLLABORATORS = 'invite_collaborators',
  MANAGE_COLLABORATORS = 'manage_collaborators',
  VIEW_COLLABORATIONS = 'view_collaborations',
  
  // Administrative permissions
  MANAGE_USERS = 'manage_users',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  VIEW_SYSTEM_METRICS = 'view_system_metrics',
  
  // Content permissions
  PUBLISH_RESEARCH = 'publish_research',
  MODERATE_CONTENT = 'moderate_content',
  DELETE_ANY_CONTENT = 'delete_any_content'
}

// Resource types for granular permissions
export enum ResourceType {
  SESSION = 'session',
  GRAPH_DATA = 'graph_data',
  STAGE_EXECUTION = 'stage_execution',
  HYPOTHESIS = 'hypothesis',
  KNOWLEDGE_GAP = 'knowledge_gap',
  COLLABORATION = 'collaboration',
  USER_PROFILE = 'user_profile',
  API_KEY = 'api_key',
  EXPORT = 'export',
  IMPORT = 'import'
}

// Action types for permissions
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  SHARE = 'share',
  EXECUTE = 'execute',
  MODERATE = 'moderate'
}

// Permission context for specific resource access
export interface PermissionContext {
  resourceType: ResourceType;
  resourceId?: string;
  action: Action;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// User profile with role information
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

// Role permission mappings
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [
    Permission.READ_SESSION // Very limited read-only access
  ],
  
  [UserRole.USER]: [
    Permission.CREATE_SESSION,
    Permission.READ_SESSION,
    Permission.UPDATE_SESSION,
    Permission.DELETE_SESSION,
    Permission.EXPORT_DATA,
    Permission.USE_GEMINI_API,
    Permission.USE_PERPLEXITY_API,
    Permission.MANAGE_API_KEYS
  ],
  
  [UserRole.RESEARCHER]: [
    // All user permissions plus:
    ...ROLE_PERMISSIONS[UserRole.USER],
    Permission.SHARE_SESSION,
    Permission.IMPORT_DATA,
    Permission.BACKUP_DATA,
    Permission.INVITE_COLLABORATORS,
    Permission.VIEW_COLLABORATIONS,
    Permission.PUBLISH_RESEARCH
  ],
  
  [UserRole.COLLABORATOR]: [
    // Focused on collaboration features
    Permission.READ_SESSION,
    Permission.UPDATE_SESSION,
    Permission.SHARE_SESSION,
    Permission.EXPORT_DATA,
    Permission.VIEW_COLLABORATIONS,
    Permission.USE_GEMINI_API,
    Permission.USE_PERPLEXITY_API
  ],
  
  [UserRole.MODERATOR]: [
    // All researcher permissions plus moderation:
    ...ROLE_PERMISSIONS[UserRole.RESEARCHER],
    Permission.MANAGE_COLLABORATORS,
    Permission.MODERATE_CONTENT,
    Permission.VIEW_AUDIT_LOGS
  ],
  
  [UserRole.ADMIN]: [
    // All moderator permissions plus admin functions:
    ...ROLE_PERMISSIONS[UserRole.MODERATOR],
    Permission.MANAGE_USERS,
    Permission.MANAGE_SYSTEM_SETTINGS,
    Permission.VIEW_SYSTEM_METRICS,
    Permission.DELETE_ANY_CONTENT
  ],
  
  [UserRole.SUPER_ADMIN]: [
    // All permissions
    ...Object.values(Permission)
  ]
};

export class AuthorizationService {
  private static instance: AuthorizationService;
  private userCache: Map<string, { profile: UserProfile; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Initialize service
  }

  static getInstance(): AuthorizationService {
    if (!AuthorizationService.instance) {
      AuthorizationService.instance = new AuthorizationService();
    }
    return AuthorizationService.instance;
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(
    userId: string,
    permission: Permission,
    context?: PermissionContext
  ): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile || !userProfile.isActive) {
        return false;
      }

      // Check role-based permissions
      const hasRolePermission = userProfile.permissions.includes(permission);
      if (!hasRolePermission) {
        await this.logAuthorizationEvent(userId, permission, false, 'insufficient_role_permissions');
        return false;
      }

      // Apply context-specific checks
      if (context) {
        const hasContextPermission = await this.checkContextualPermission(userProfile, context);
        if (!hasContextPermission) {
          await this.logAuthorizationEvent(userId, permission, false, 'insufficient_contextual_permissions');
          return false;
        }
      }

      await this.logAuthorizationEvent(userId, permission, true);
      return true;

    } catch (error) {
      console.error('Permission check failed:', error);
      await this.logAuthorizationEvent(userId, permission, false, 'permission_check_error');
      return false;
    }
  }

  /**
   * Check multiple permissions at once
   */
  async hasPermissions(
    userId: string,
    permissions: Permission[],
    context?: PermissionContext
  ): Promise<boolean> {
    for (const permission of permissions) {
      const hasPermission = await this.hasPermission(userId, permission, context);
      if (!hasPermission) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get user profile with role and permissions
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Check cache first
      const cached = this.userCache.get(userId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.profile;
      }

      // Fetch from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('Failed to get user profile:', error);
        return null;
      }

      const userProfile: UserProfile = {
        id: profile.id,
        email: profile.email,
        role: profile.role || UserRole.USER,
        permissions: ROLE_PERMISSIONS[profile.role || UserRole.USER] || [],
        isActive: profile.is_active !== false,
        lastLoginAt: profile.last_login_at,
        createdAt: profile.created_at,
        metadata: profile.metadata
      };

      // Cache the result
      this.userCache.set(userId, {
        profile: userProfile,
        timestamp: Date.now()
      });

      return userProfile;

    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(
    adminUserId: string,
    targetUserId: string,
    newRole: UserRole
  ): Promise<boolean> {
    try {
      // Check if admin has permission to manage users
      const hasPermission = await this.hasPermission(adminUserId, Permission.MANAGE_USERS);
      if (!hasPermission) {
        throw new Error('Insufficient permissions to manage users');
      }

      // Prevent users from promoting themselves to super admin
      if (adminUserId === targetUserId && newRole === UserRole.SUPER_ADMIN) {
        const adminProfile = await this.getUserProfile(adminUserId);
        if (adminProfile?.role !== UserRole.SUPER_ADMIN) {
          throw new Error('Cannot self-promote to super admin');
        }
      }

      // Update role in database
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId);

      if (error) {
        throw error;
      }

      // Clear cache for target user
      this.userCache.delete(targetUserId);

      // Log the role change
      securityLogger.logEvent({
        event_type: SecurityEventType.AUTHORIZATION,
        severity: SecurityEventSeverity.INFO,
        user_id: adminUserId,
        details: {
          action: 'role_updated',
          target_user_id: targetUserId,
          new_role: newRole,
          timestamp: new Date().toISOString()
        }
      });

      return true;

    } catch (error) {
      console.error('Failed to update user role:', error);
      
      securityLogger.logEvent({
        event_type: SecurityEventType.AUTHORIZATION,
        severity: SecurityEventSeverity.ERROR,
        user_id: adminUserId,
        details: {
          action: 'role_update_failed',
          target_user_id: targetUserId,
          new_role: newRole,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return false;
    }
  }

  /**
   * Check if user can access a specific resource
   */
  async canAccessResource(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    action: Action
  ): Promise<boolean> {
    try {
      const context: PermissionContext = {
        resourceType,
        resourceId,
        action,
        userId
      };

      // Map actions to permissions
      const permission = this.mapActionToPermission(resourceType, action);
      if (!permission) {
        return false;
      }

      return await this.hasPermission(userId, permission, context);

    } catch (error) {
      console.error('Resource access check failed:', error);
      return false;
    }
  }

  /**
   * Get all users with their roles (admin only)
   */
  async getAllUsers(adminUserId: string): Promise<UserProfile[]> {
    try {
      const hasPermission = await this.hasPermission(adminUserId, Permission.MANAGE_USERS);
      if (!hasPermission) {
        throw new Error('Insufficient permissions to view all users');
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        role: profile.role || UserRole.USER,
        permissions: ROLE_PERMISSIONS[profile.role || UserRole.USER] || [],
        isActive: profile.is_active !== false,
        lastLoginAt: profile.last_login_at,
        createdAt: profile.created_at,
        metadata: profile.metadata
      }));

    } catch (error) {
      console.error('Failed to get all users:', error);
      return [];
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(adminUserId: string, targetUserId: string): Promise<boolean> {
    try {
      const hasPermission = await this.hasPermission(adminUserId, Permission.MANAGE_USERS);
      if (!hasPermission) {
        throw new Error('Insufficient permissions to deactivate users');
      }

      // Prevent self-deactivation
      if (adminUserId === targetUserId) {
        throw new Error('Cannot deactivate your own account');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivated_by: adminUserId
        })
        .eq('id', targetUserId);

      if (error) {
        throw error;
      }

      // Clear cache
      this.userCache.delete(targetUserId);

      securityLogger.logEvent({
        event_type: SecurityEventType.AUTHORIZATION,
        severity: SecurityEventSeverity.WARNING,
        user_id: adminUserId,
        details: {
          action: 'user_deactivated',
          target_user_id: targetUserId,
          timestamp: new Date().toISOString()
        }
      });

      return true;

    } catch (error) {
      console.error('Failed to deactivate user:', error);
      return false;
    }
  }

  /**
   * Clear user cache
   */
  clearUserCache(userId?: string): void {
    if (userId) {
      this.userCache.delete(userId);
    } else {
      this.userCache.clear();
    }
  }

  /**
   * Private helper methods
   */
  private async checkContextualPermission(
    userProfile: UserProfile,
    context: PermissionContext
  ): Promise<boolean> {
    // Resource ownership checks
    if (context.resourceId) {
      const isOwner = await this.isResourceOwner(userProfile.id, context.resourceType, context.resourceId);
      if (isOwner) {
        return true; // Owners have full access to their resources
      }

      // Collaboration checks for sessions
      if (context.resourceType === ResourceType.SESSION) {
        const isCollaborator = await this.isSessionCollaborator(userProfile.id, context.resourceId);
        if (isCollaborator && [Action.READ, Action.UPDATE].includes(context.action)) {
          return true;
        }
      }
    }

    // Role-based contextual checks
    switch (context.resourceType) {
      case ResourceType.USER_PROFILE:
        // Users can only modify their own profile unless they're admin
        if (context.resourceId === userProfile.id) {
          return true;
        }
        return userProfile.permissions.includes(Permission.MANAGE_USERS);

      case ResourceType.API_KEY:
        // Users can only manage their own API keys
        return context.resourceId === userProfile.id;

      default:
        return true; // Default allow for other resources if base permission exists
    }
  }

  private async isResourceOwner(
    userId: string,
    resourceType: ResourceType,
    resourceId: string
  ): Promise<boolean> {
    try {
      let tableName: string;
      let ownerColumn = 'user_id';

      switch (resourceType) {
        case ResourceType.SESSION:
          tableName = 'research_sessions';
          break;
        case ResourceType.GRAPH_DATA:
          tableName = 'graph_data';
          break;
        case ResourceType.COLLABORATION:
          tableName = 'research_collaborations';
          ownerColumn = 'owner_id';
          break;
        default:
          return false;
      }

      const { data, error } = await supabase
        .from(tableName)
        .select(ownerColumn)
        .eq('id', resourceId)
        .single();

      if (error || !data) {
        return false;
      }

      return data[ownerColumn] === userId;

    } catch (error) {
      console.error('Failed to check resource ownership:', error);
      return false;
    }
  }

  private async isSessionCollaborator(userId: string, sessionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('research_collaborations')
        .select('collaborator_id')
        .eq('session_id', sessionId)
        .eq('collaborator_id', userId)
        .eq('status', 'accepted')
        .single();

      return !error && !!data;

    } catch (error) {
      console.error('Failed to check collaboration status:', error);
      return false;
    }
  }

  private mapActionToPermission(resourceType: ResourceType, action: Action): Permission | null {
    const actionMap: Record<string, Permission> = {
      [`${ResourceType.SESSION}_${Action.CREATE}`]: Permission.CREATE_SESSION,
      [`${ResourceType.SESSION}_${Action.READ}`]: Permission.READ_SESSION,
      [`${ResourceType.SESSION}_${Action.UPDATE}`]: Permission.UPDATE_SESSION,
      [`${ResourceType.SESSION}_${Action.DELETE}`]: Permission.DELETE_SESSION,
      [`${ResourceType.SESSION}_${Action.SHARE}`]: Permission.SHARE_SESSION,
      [`${ResourceType.EXPORT}_${Action.CREATE}`]: Permission.EXPORT_DATA,
      [`${ResourceType.IMPORT}_${Action.CREATE}`]: Permission.IMPORT_DATA,
      [`${ResourceType.COLLABORATION}_${Action.CREATE}`]: Permission.INVITE_COLLABORATORS,
      [`${ResourceType.COLLABORATION}_${Action.UPDATE}`]: Permission.MANAGE_COLLABORATORS,
      [`${ResourceType.USER_PROFILE}_${Action.UPDATE}`]: Permission.MANAGE_USERS,
    };

    return actionMap[`${resourceType}_${action}`] || null;
  }

  private async logAuthorizationEvent(
    userId: string,
    permission: Permission,
    granted: boolean,
    reason?: string
  ): Promise<void> {
    securityLogger.logEvent({
      event_type: SecurityEventType.AUTHORIZATION,
      severity: granted ? SecurityEventSeverity.INFO : SecurityEventSeverity.WARNING,
      user_id: userId,
      details: {
        permission,
        granted,
        reason,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Export singleton instance
export const authorizationService = AuthorizationService.getInstance();

// Helper functions for common permission checks
export const checkPermission = (userId: string, permission: Permission, context?: PermissionContext) =>
  authorizationService.hasPermission(userId, permission, context);

export const checkResourceAccess = (
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  action: Action
) => authorizationService.canAccessResource(userId, resourceType, resourceId, action);

export const getCurrentUserProfile = (userId: string) =>
  authorizationService.getUserProfile(userId);