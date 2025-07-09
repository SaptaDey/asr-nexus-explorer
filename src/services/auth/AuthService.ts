/**
 * Authentication Service for ASR-GoT Framework
 * Handles user authentication, session management, and profile management with Supabase
 */

import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import { DatabaseService, DbProfile } from '../database/DatabaseService';

export interface AuthUser extends User {
  profile?: DbProfile;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  researchInterests?: string[];
  expertiseAreas?: string[];
  institution?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ProfileUpdateData {
  fullName?: string;
  researchInterests?: string[];
  expertiseAreas?: string[];
  institution?: string;
  avatarUrl?: string;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

export class AuthService {
  private supabase: SupabaseClient;
  private db: DatabaseService;
  private authStateListeners: Set<(state: AuthState) => void> = new Set();
  private currentState: AuthState = {
    user: null,
    session: null,
    loading: true,
    initialized: false
  };

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.db = new DatabaseService();
    
    this.initialize();
  }

  /**
   * Initialize auth service and set up session monitoring
   */
  private async initialize(): Promise<void> {
    try {
      // Get initial session
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting initial session:', error);
      } else {
        await this.handleSessionChange(session);
      }

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        await this.handleSessionChange(session);
      });

      this.updateState({ initialized: true, loading: false });

    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      this.updateState({ initialized: true, loading: false });
    }
  }

  /**
   * Handle session changes and update auth state
   */
  private async handleSessionChange(session: Session | null): Promise<void> {
    try {
      let authUser: AuthUser | null = null;

      if (session?.user) {
        // Load user profile
        const profile = await this.db.getProfile(session.user.id);
        authUser = {
          ...session.user,
          profile: profile || undefined
        };
      }

      this.updateState({
        user: authUser,
        session,
        loading: false
      });

    } catch (error) {
      console.error('Error handling session change:', error);
      this.updateState({
        user: null,
        session: null,
        loading: false
      });
    }
  }

  /**
   * Update auth state and notify listeners
   */
  private updateState(updates: Partial<AuthState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.authStateListeners.forEach(listener => listener(this.currentState));
  }

  /**
   * Subscribe to auth state changes
   */
  public onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateListeners.add(callback);
    
    // Immediately call with current state
    callback(this.currentState);
    
    return () => {
      this.authStateListeners.delete(callback);
    };
  }

  /**
   * Get current auth state
   */
  public getAuthState(): AuthState {
    return this.currentState;
  }

  /**
   * Get current user
   */
  public getCurrentUser(): AuthUser | null {
    return this.currentState.user;
  }

  /**
   * Get current session
   */
  public getCurrentSession(): Session | null {
    return this.currentState.session;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.currentState.session && !!this.currentState.user;
  }

  /**
   * Check if user has specific role or permission
   */
  public hasPermission(permission: string): boolean {
    // This could be enhanced with role-based permissions
    return this.isAuthenticated();
  }

  /**
   * Sign up new user
   */
  public async signUp(data: SignUpData): Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }> {
    try {
      this.updateState({ loading: true });

      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            research_interests: data.researchInterests,
            expertise_areas: data.expertiseAreas,
            institution: data.institution
          }
        }
      });

      if (error) {
        this.updateState({ loading: false });
        return { user: null, session: null, error };
      }

      // Profile will be created automatically by the database trigger
      // Session change will be handled by the auth state change listener

      return { 
        user: authData.user, 
        session: authData.session, 
        error: null 
      };

    } catch (error) {
      this.updateState({ loading: false });
      const authError = error as AuthError;
      return { user: null, session: null, error: authError };
    }
  }

  /**
   * Sign in user
   */
  public async signIn(data: SignInData): Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }> {
    try {
      this.updateState({ loading: true });

      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        this.updateState({ loading: false });
        return { user: null, session: null, error };
      }

      // Session change will be handled by the auth state change listener

      return { 
        user: authData.user, 
        session: authData.session, 
        error: null 
      };

    } catch (error) {
      this.updateState({ loading: false });
      const authError = error as AuthError;
      return { user: null, session: null, error: authError };
    }
  }

  /**
   * Sign in with OAuth provider
   */
  public async signInWithProvider(provider: 'google' | 'github' | 'microsoft'): Promise<{
    data: any;
    error: AuthError | null;
  }> {
    try {
      this.updateState({ loading: true });

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        this.updateState({ loading: false });
        return { data: null, error };
      }

      return { data, error: null };

    } catch (error) {
      this.updateState({ loading: false });
      const authError = error as AuthError;
      return { data: null, error: authError };
    }
  }

  /**
   * Sign out user
   */
  public async signOut(): Promise<{ error: AuthError | null }> {
    try {
      this.updateState({ loading: true });

      const { error } = await this.supabase.auth.signOut();

      if (error) {
        this.updateState({ loading: false });
        return { error };
      }

      // Session change will be handled by the auth state change listener

      return { error: null };

    } catch (error) {
      this.updateState({ loading: false });
      const authError = error as AuthError;
      return { error: authError };
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(data: ProfileUpdateData): Promise<{
    profile: DbProfile | null;
    error: Error | null;
  }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { profile: null, error: new Error('User not authenticated') };
      }

      this.updateState({ loading: true });

      // Update profile in database
      const profile = await this.db.updateProfile(user.id, {
        full_name: data.fullName,
        research_interests: data.researchInterests,
        expertise_areas: data.expertiseAreas,
        institution: data.institution,
        avatar_url: data.avatarUrl
      });

      // Update current user state with new profile
      const updatedUser: AuthUser = {
        ...user,
        profile
      };

      this.updateState({ 
        user: updatedUser,
        loading: false 
      });

      return { profile, error: null };

    } catch (error) {
      this.updateState({ loading: false });
      return { profile: null, error: error as Error };
    }
  }

  /**
   * Update user email
   */
  public async updateEmail(newEmail: string): Promise<{
    user: User | null;
    error: AuthError | null;
  }> {
    try {
      this.updateState({ loading: true });

      const { data, error } = await this.supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        this.updateState({ loading: false });
        return { user: null, error };
      }

      // Update profile email
      if (data.user) {
        await this.db.updateProfile(data.user.id, {
          email: newEmail
        });
      }

      this.updateState({ loading: false });

      return { user: data.user, error: null };

    } catch (error) {
      this.updateState({ loading: false });
      const authError = error as AuthError;
      return { user: null, error: authError };
    }
  }

  /**
   * Update user password
   */
  public async updatePassword(data: PasswordUpdateData): Promise<{
    user: User | null;
    error: AuthError | null;
  }> {
    try {
      this.updateState({ loading: true });

      // Supabase doesn't require current password for update
      // In a production app, you might want to re-authenticate first
      const { data: userData, error } = await this.supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        this.updateState({ loading: false });
        return { user: null, error };
      }

      this.updateState({ loading: false });

      return { user: userData.user, error: null };

    } catch (error) {
      this.updateState({ loading: false });
      const authError = error as AuthError;
      return { user: null, error: authError };
    }
  }

  /**
   * Request password reset
   */
  public async requestPasswordReset(data: PasswordResetData): Promise<{
    error: AuthError | null;
  }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      return { error };

    } catch (error) {
      const authError = error as AuthError;
      return { error: authError };
    }
  }

  /**
   * Refresh session
   */
  public async refreshSession(): Promise<{
    session: Session | null;
    error: AuthError | null;
  }> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) {
        return { session: null, error };
      }

      return { session: data.session, error: null };

    } catch (error) {
      const authError = error as AuthError;
      return { session: null, error: authError };
    }
  }

  /**
   * Get user sessions (for security management)
   */
  public async getUserSessions(): Promise<{
    sessions: any[];
    error: Error | null;
  }> {
    try {
      // This would require additional implementation
      // For now, return current session only
      const currentSession = this.getCurrentSession();
      
      return {
        sessions: currentSession ? [currentSession] : [],
        error: null
      };

    } catch (error) {
      return { sessions: [], error: error as Error };
    }
  }

  /**
   * Verify email
   */
  public async verifyEmail(token: string, type: 'signup' | 'email_change'): Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }> {
    try {
      const { data, error } = await this.supabase.auth.verifyOtp({
        token_hash: token,
        type: type
      });

      return {
        user: data.user,
        session: data.session,
        error
      };

    } catch (error) {
      const authError = error as AuthError;
      return { user: null, session: null, error: authError };
    }
  }

  /**
   * Delete user account
   */
  public async deleteAccount(): Promise<{ error: Error | null }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { error: new Error('User not authenticated') };
      }

      // Note: Supabase doesn't have a direct delete user method for clients
      // This would typically be handled by an admin function
      // For now, we'll just sign out
      await this.signOut();

      return { error: null };

    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Check if email is available
   */
  public async checkEmailAvailability(email: string): Promise<{
    available: boolean;
    error: Error | null;
  }> {
    try {
      // This would require a custom function or endpoint
      // For now, we'll assume email is available
      return { available: true, error: null };

    } catch (error) {
      return { available: false, error: error as Error };
    }
  }

  /**
   * Get auth headers for API requests
   */
  public getAuthHeaders(): Record<string, string> {
    const session = this.getCurrentSession();
    
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };
    }

    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Check if session is expired
   */
  public isSessionExpired(): boolean {
    const session = this.getCurrentSession();
    
    if (!session) return true;

    const expiresAt = session.expires_at;
    if (!expiresAt) return false;

    return Date.now() / 1000 > expiresAt;
  }

  /**
   * Auto-refresh session before expiry
   */
  public async autoRefreshSession(): Promise<void> {
    const session = this.getCurrentSession();
    
    if (!session || !session.expires_at) return;

    // Refresh 5 minutes before expiry
    const refreshTime = (session.expires_at - 300) * 1000;
    const timeUntilRefresh = refreshTime - Date.now();

    if (timeUntilRefresh > 0) {
      setTimeout(async () => {
        try {
          await this.refreshSession();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }, timeUntilRefresh);
    }
  }

  /**
   * Get user activity logs
   */
  public async getUserActivityLogs(limit = 50): Promise<{
    activities: any[];
    error: Error | null;
  }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { activities: [], error: new Error('User not authenticated') };
      }

      const { data, error } = await this.supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { activities: data || [], error: null };

    } catch (error) {
      return { activities: [], error: error as Error };
    }
  }
}

// Singleton instance
export const authService = new AuthService();