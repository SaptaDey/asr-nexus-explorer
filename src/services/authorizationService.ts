/**
 * Authorization Service
 * SECURITY: Resource-level authorization and permission-based access control
 */

import { supabase } from '@/integrations/supabase/client';
import { securityLogger, SecurityEventType, SecurityEventSeverity, logDataAccess } from './securityEventLogger';
import type { User } from '@supabase/supabase-js';

// Permission types
export enum Permission {
  // Research permissions
  CREATE_RESEARCH = 'CREATE_RESEARCH',
  VIEW_RESEARCH = 'VIEW_RESEARCH',
  EDIT_RESEARCH = 'EDIT_RESEARCH',
  DELETE_RESEARCH = 'DELETE_RESEARCH',
  SHARE_RESEARCH = 'SHARE_RESEARCH',
  
  // API permissions
  USE_GEMINI_API = 'USE_GEMINI_API',
  USE_PERPLEXITY_API = 'USE_PERPLEXITY_API',
  MANAGE_API_KEYS = 'MANAGE_API_KEYS',
  
  // Data permissions
  EXPORT_DATA = 'EXPORT_DATA',
  IMPORT_DATA = 'IMPORT_DATA',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  
  // Admin permissions
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
  
  // Advanced features
  USE_DEVELOPER_MODE = 'USE_DEVELOPER_MODE',
  MODIFY_PARAMETERS = 'MODIFY_PARAMETERS',
  ACCESS_RAW_DATA = 'ACCESS_RAW_DATA'
}

// User roles with hierarchical permissions
export enum Role {
  GUEST = 'GUEST',
  USER = 'USER',
  RESEARCHER = 'RESEARCHER',
  PREMIUM = 'PREMIUM',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// Resource types for authorization
export enum ResourceType {
  RESEARCH_SESSION = 'RESEARCH_SESSION',
  QUERY_RESULT = 'QUERY_RESULT',
  API_KEY = 'API_KEY',
  USER_PROFILE = 'USER_PROFILE',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
  AUDIT_LOG = 'AUDIT_LOG'
}

interface AuthorizationContext {
  user: User;
  resource?: {
    type: ResourceType;
    id: string;
    ownerId?: string;
    sharedWith?: string[];
    isPublic?: boolean;
  };
  action: Permission;
  environment?: {
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
  };
}

interface AuthorizationResult {
  granted: boolean;
  reason?: string;
  conditions?: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

class AuthorizationService {
  private static instance: AuthorizationService;
  
  // Role-based permissions mapping
  private readonly rolePermissions: Record<Role, Permission[]> = {
    [Role.GUEST]: [
      Permission.VIEW_RESEARCH // Very limited access
    ],
    [Role.USER]: [
      Permission.CREATE_RESEARCH,
      Permission.VIEW_RESEARCH,
      Permission.EDIT_RESEARCH,
      Permission.USE_GEMINI_API,
      Permission.MANAGE_API_KEYS,
      Permission.EXPORT_DATA
    ],
    [Role.RESEARCHER]: [
      ...this.rolePermissions?.[Role.USER] || [],
      Permission.DELETE_RESEARCH,
      Permission.SHARE_RESEARCH,
      Permission.USE_PERPLEXITY_API,
      Permission.VIEW_ANALYTICS,
      Permission.IMPORT_DATA
    ],
    [Role.PREMIUM]: [
      ...this.rolePermissions?.[Role.RESEARCHER] || [],
      Permission.USE_DEVELOPER_MODE,
      Permission.MODIFY_PARAMETERS,
      Permission.ACCESS_RAW_DATA
    ],
    [Role.ADMIN]: [
      ...this.rolePermissions?.[Role.PREMIUM] || [],
      Permission.MANAGE_USERS,
      Permission.VIEW_AUDIT_LOGS
    ],
    [Role.SUPER_ADMIN]: [
      ...Object.values(Permission) // All permissions
    ]
  };
  
  private constructor() {
    // Ensure permissions are properly inherited
    this.initializeRoleHierarchy();
  }
  
  static getInstance(): AuthorizationService {
    if (!AuthorizationService.instance) {
      AuthorizationService.instance = new AuthorizationService();
    }
    return AuthorizationService.instance;
  }
  
  /**
   * Initialize role hierarchy to ensure proper permission inheritance
   */
  private initializeRoleHierarchy(): void {
    // Build permission inheritance
    const roles = [Role.GUEST, Role.USER, Role.RESEARCHER, Role.PREMIUM, Role.ADMIN, Role.SUPER_ADMIN];
    
    for (let i = 1; i < roles.length; i++) {
      const currentRole = roles[i];
      const previousRole = roles[i - 1];
      
      if (this.rolePermissions[currentRole] && this.rolePermissions[previousRole]) {
        // Merge permissions from lower role
        this.rolePermissions[currentRole] = [
          ...new Set([
            ...this.rolePermissions[previousRole],
            ...this.rolePermissions[currentRole]
          ])
        ];
      }
    }
  }
  
  /**
   * Check if user has permission for an action
   */
  async hasPermission(context: AuthorizationContext): Promise<AuthorizationResult> {
    try {
      const userRole = await this.getUserRole(context.user.id);
      const userPermissions = this.rolePermissions[userRole] || [];
      
      // Check if user has the required permission
      const hasBasicPermission = userPermissions.includes(context.action);
      
      if (!hasBasicPermission) {
        this.logAuthorizationEvent(context, false, 'Insufficient permissions');
        return {
          granted: false,
          reason: 'User does not have required permission',
          riskLevel: 'medium'
        };
      }
      
      // Resource-specific authorization checks
      if (context.resource) {
        const resourceCheck = await this.checkResourceAccess(context);
        if (!resourceCheck.granted) {
          return resourceCheck;
        }
      }
      
      // Environmental checks
      const environmentCheck = this.checkEnvironmentalFactors(context);
      if (!environmentCheck.granted) {
        return environmentCheck;
      }
      
      // Success
      this.logAuthorizationEvent(context, true);
      return {
        granted: true,
        riskLevel: 'low'
      };
      
    } catch (error) {
      console.error('Authorization check failed:', error);
      this.logAuthorizationEvent(context, false, 'Authorization system error');
      
      return {
        granted: false,
        reason: 'Authorization system unavailable',
        riskLevel: 'high'
      };
    }
  }
  
  /**
   * Check resource-specific access
   */
  private async checkResourceAccess(context: AuthorizationContext): Promise<AuthorizationResult> {
    if (!context.resource) {
      return { granted: true, riskLevel: 'low' };
    }
    
    const { resource, user } = context;
    
    // Public resources are accessible to all
    if (resource.isPublic) {
      return { granted: true, riskLevel: 'low' };
    }
    
    // Owner always has access
    if (resource.ownerId === user.id) {
      return { granted: true, riskLevel: 'low' };
    }
    
    // Check if resource is shared with user
    if (resource.sharedWith?.includes(user.id)) {
      return { 
        granted: true, 
        riskLevel: 'low',
        conditions: ['Shared resource access']
      };
    }
    
    // Check role-based access for system resources
    if (resource.type === ResourceType.SYSTEM_CONFIG || resource.type === ResourceType.AUDIT_LOG) {
      const userRole = await this.getUserRole(user.id);
      if (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) {
        return { granted: true, riskLevel: 'medium' };
      }
    }
    
    // Default deny
    this.logAuthorizationEvent(context, false, 'Resource access denied');
    return {
      granted: false,
      reason: 'No access to this resource',
      riskLevel: 'medium'
    };
  }
  
  /**
   * Check environmental factors
   */
  private checkEnvironmentalFactors(context: AuthorizationContext): AuthorizationResult {
    const conditions: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    // Time-based checks (for sensitive operations)
    const sensitiveActions = [
      Permission.DELETE_RESEARCH,
      Permission.MANAGE_USERS,
      Permission.MANAGE_SYSTEM
    ];
    
    if (sensitiveActions.includes(context.action)) {
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) {
        riskLevel = 'medium';
        conditions.push('Unusual time access');
      }
    }
    
    // IP-based checks could be added here
    // Device fingerprint checks could be added here
    
    return {
      granted: true,
      riskLevel,
      conditions: conditions.length > 0 ? conditions : undefined
    };
  }
  
  /**
   * Get user role from database or cache
   */
  private async getUserRole(userId: string): Promise<Role> {
    try {
      // Try to get from user metadata first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.user_metadata?.role) {
        return user.user_metadata.role as Role;
      }
      
      // Fallback: query user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('user_id', userId)
        .single();
      
      if (profile?.subscription_tier) {
        // Map subscription tier to role
        const tierRoleMap: Record<string, Role> = {
          'free': Role.USER,
          'pro': Role.RESEARCHER,
          'enterprise': Role.PREMIUM
        };
        
        return tierRoleMap[profile.subscription_tier] || Role.USER;
      }
      
      // Default role
      return Role.USER;
      
    } catch (error) {
      console.error('Failed to get user role:', error);
      return Role.GUEST; // Fail to least privilege
    }
  }
  
  /**
   * Update user role
   */
  async updateUserRole(userId: string, newRole: Role, updatedBy: string): Promise<boolean> {
    try {
      // Only admins can change roles
      const updaterRole = await this.getUserRole(updatedBy);
      if (updaterRole !== Role.ADMIN && updaterRole !== Role.SUPER_ADMIN) {
        return false;
      }
      
      // Super admin role can only be set by another super admin
      if (newRole === Role.SUPER_ADMIN && updaterRole !== Role.SUPER_ADMIN) {
        return false;
      }
      
      // Update user metadata (in a real app, this would be server-side)
      const { error } = await supabase.auth.updateUser({
        data: { role: newRole }
      });
      
      if (error) {
        console.error('Failed to update user role:', error);
        return false;
      }
      
      securityLogger.logEvent({
        event_type: SecurityEventType.SECURITY_CONFIG_CHANGED,
        severity: SecurityEventSeverity.WARNING,
        user_id: updatedBy,
        details: {
          action: 'role_updated',
          target_user: userId,
          new_role: newRole,
          updated_by: updatedBy
        }
      });
      
      return true;
    } catch (error) {
      console.error('Role update failed:', error);
      return false;
    }
  }
  
  /**
   * Check multiple permissions at once
   */
  async hasPermissions(userId: string, permissions: Permission[]): Promise<Record<Permission, boolean>> {
    const user = { id: userId } as User;
    const results: Record<Permission, boolean> = {} as Record<Permission, boolean>;
    
    for (const permission of permissions) {
      const context: AuthorizationContext = {
        user,
        action: permission,
        environment: { timestamp: new Date() }
      };
      
      const result = await this.hasPermission(context);
      results[permission] = result.granted;
    }
    
    return results;
  }
  
  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const role = await this.getUserRole(userId);
      return this.rolePermissions[role] || [];
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  }
  
  /**
   * Create authorization context for resource access
   */
  createResourceContext(
    user: User,
    action: Permission,
    resourceType: ResourceType,
    resourceId: string,
    ownerId?: string
  ): AuthorizationContext {
    return {
      user,
      action,
      resource: {
        type: resourceType,
        id: resourceId,
        ownerId
      },
      environment: {
        timestamp: new Date()
      }
    };
  }
  
  /**
   * Validate data access operations
   */
  async validateDataAccess(
    userId: string,
    operation: 'read' | 'write' | 'delete',
    resourceType: ResourceType,
    resourceId: string,
    ownerId?: string
  ): Promise<boolean> {
    const user = { id: userId } as User;
    
    // Map operations to permissions
    const operationPermissions: Record<string, Permission> = {
      'read': Permission.VIEW_RESEARCH,
      'write': Permission.EDIT_RESEARCH,
      'delete': Permission.DELETE_RESEARCH
    };
    
    const permission = operationPermissions[operation];
    if (!permission) {
      return false;
    }
    
    const context = this.createResourceContext(user, permission, resourceType, resourceId, ownerId);
    const result = await this.hasPermission(context);
    
    // Log data access
    logDataAccess(`${resourceType}:${resourceId}`, operation, result.granted);
    
    return result.granted;
  }
  
  /**
   * Log authorization events
   */
  private logAuthorizationEvent(
    context: AuthorizationContext,
    granted: boolean,
    reason?: string
  ): void {
    securityLogger.logEvent({
      event_type: granted ? SecurityEventType.ACCESS_GRANTED : SecurityEventType.ACCESS_DENIED,
      severity: granted ? SecurityEventSeverity.INFO : SecurityEventSeverity.WARNING,
      user_id: context.user.id,
      resource: context.resource ? `${context.resource.type}:${context.resource.id}` : undefined,
      action: context.action,
      result: granted ? 'success' : 'failure',
      error_message: reason,
      details: {
        permission: context.action,
        resource_type: context.resource?.type,
        resource_id: context.resource?.id,
        timestamp: context.environment?.timestamp
      }
    });
  }
}

// Export singleton instance
export const authorizationService = AuthorizationService.getInstance();

// Helper functions for common authorization checks
export const checkPermission = async (user: User, permission: Permission, resource?: any) => {
  const context: AuthorizationContext = {
    user,
    action: permission,
    resource,
    environment: { timestamp: new Date() }
  };
  
  return authorizationService.hasPermission(context);
};

export const canAccessResource = async (
  userId: string,
  action: Permission,
  resourceType: ResourceType,
  resourceId: string,
  ownerId?: string
) => {
  return authorizationService.validateDataAccess(userId, 'read', resourceType, resourceId, ownerId);
};

export const canModifyResource = async (
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  ownerId?: string
) => {
  return authorizationService.validateDataAccess(userId, 'write', resourceType, resourceId, ownerId);
};

export const canDeleteResource = async (
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  ownerId?: string
) => {
  return authorizationService.validateDataAccess(userId, 'delete', resourceType, resourceId, ownerId);
};

export const getUserPermissions = (userId: string) => authorizationService.getUserPermissions(userId);
export const updateUserRole = (userId: string, role: Role, updatedBy: string) => 
  authorizationService.updateUserRole(userId, role, updatedBy);