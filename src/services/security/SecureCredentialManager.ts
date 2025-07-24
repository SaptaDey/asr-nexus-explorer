/**
 * Secure Credential Manager
 * Handles API key storage with encryption and secure memory management
 */

import { APICredentials } from '@/types/asrGotTypes';
import { encryptData, decryptData, secureHash } from '@/utils/securityUtils';

export interface CredentialMetadata {
  provider: string;
  keyId: string;
  lastUsed: string;
  isValid: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface SecureCredentialStorage {
  encryptedCredentials: string;
  keyIds: string[];
  checksum: string;
  metadata: CredentialMetadata[];
  timestamp: string;
}

export class SecureCredentialManager {
  private static instance: SecureCredentialManager;
  private readonly STORAGE_KEY = 'asr-got-secure-credentials';
  private readonly TEMP_KEY = 'asr-got-temp-session';
  private readonly MAX_SESSION_TIME = 4 * 60 * 60 * 1000; // 4 hours
  private readonly ENCRYPTION_KEY_LENGTH = 32;
  
  private memoryCredentials: APICredentials | null = null;
  private sessionStartTime: number = 0;
  private encryptionKey: string | null = null;

  private constructor() {
    // Clear any existing insecure storage
    this.clearInsecureStorage();
    
    // Set up session cleanup
    this.setupSessionCleanup();
  }

  static getInstance(): SecureCredentialManager {
    if (!SecureCredentialManager.instance) {
      SecureCredentialManager.instance = new SecureCredentialManager();
    }
    return SecureCredentialManager.instance;
  }

  /**
   * Initialize secure session with user authentication
   */
  async initializeSecureSession(userPin?: string): Promise<boolean> {
    try {
      // Generate or derive encryption key
      this.encryptionKey = userPin 
        ? await this.deriveEncryptionKey(userPin)
        : await this.generateSessionKey();
        
      this.sessionStartTime = Date.now();
      
      // Try to load existing credentials
      await this.loadCredentialsFromSecureStorage();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize secure session:', error);
      return false;
    }
  }

  /**
   * Store API credentials securely
   */
  async storeCredentials(credentials: APICredentials): Promise<boolean> {
    try {
      if (!this.encryptionKey) {
        throw new Error('Secure session not initialized');
      }

      // Validate credentials format
      this.validateCredentialFormat(credentials);

      // Create metadata
      const metadata: CredentialMetadata[] = [];
      Object.entries(credentials).forEach(([provider, key]) => {
        if (key && key.trim()) {
          metadata.push({
            provider,
            keyId: this.generateKeyId(key),
            lastUsed: new Date().toISOString(),
            isValid: true,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          });
        }
      });

      // Encrypt credentials
      const encryptedCredentials = await encryptData(
        JSON.stringify(credentials), 
        this.encryptionKey
      );

      // Create secure storage object
      const secureStorage: SecureCredentialStorage = {
        encryptedCredentials,
        keyIds: metadata.map(m => m.keyId),
        checksum: await secureHash(JSON.stringify(credentials)),
        metadata,
        timestamp: new Date().toISOString()
      };

      // Store encrypted data
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(secureStorage));
      
      // Keep in memory for current session
      this.memoryCredentials = { ...credentials };
      
      console.log('✅ Credentials stored securely with encryption');
      return true;
      
    } catch (error) {
      console.error('Failed to store credentials securely:', error);
      return false;
    }
  }

  /**
   * Retrieve API credentials securely
   */
  async getCredentials(): Promise<APICredentials | null> {
    try {
      // Check session validity
      if (!this.isSessionValid()) {
        await this.clearSession();
        return null;
      }

      // Return from memory if available
      if (this.memoryCredentials) {
        return { ...this.memoryCredentials };
      }

      // Load from secure storage
      return await this.loadCredentialsFromSecureStorage();
      
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      return null;
    }
  }

  /**
   * Update last used timestamp for a credential
   */
  async updateLastUsed(provider: string): Promise<void> {
    try {
      const storedData = sessionStorage.getItem(this.STORAGE_KEY);
      if (!storedData) return;

      const secureStorage: SecureCredentialStorage = JSON.parse(storedData);
      const metadata = secureStorage.metadata.find(m => m.provider === provider);
      
      if (metadata) {
        metadata.lastUsed = new Date().toISOString();
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(secureStorage));
      }
    } catch (error) {
      console.warn('Failed to update last used timestamp:', error);
    }
  }

  /**
   * Check if credentials are available and valid
   */
  async hasValidCredentials(): Promise<boolean> {
    const credentials = await this.getCredentials();
    return !!(credentials && (credentials.gemini || credentials.perplexity));
  }

  /**
   * Get credential metadata without exposing keys
   */
  async getCredentialMetadata(): Promise<CredentialMetadata[]> {
    try {
      const storedData = sessionStorage.getItem(this.STORAGE_KEY);
      if (!storedData) return [];

      const secureStorage: SecureCredentialStorage = JSON.parse(storedData);
      return secureStorage.metadata;
    } catch (error) {
      console.error('Failed to get credential metadata:', error);
      return [];
    }
  }

  /**
   * Clear all credentials and session data
   */
  async clearSession(): Promise<void> {
    try {
      // Clear memory
      this.memoryCredentials = null;
      this.encryptionKey = null;
      this.sessionStartTime = 0;

      // Clear storage
      sessionStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.TEMP_KEY);
      
      // Clear any legacy storage
      this.clearInsecureStorage();
      
      console.log('🧹 Secure session cleared');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Validate credential format and security
   */
  private validateCredentialFormat(credentials: APICredentials): void {
    // Check for valid Gemini key format
    if (credentials.gemini && !credentials.gemini.startsWith('AIza')) {
      throw new Error('Invalid Gemini API key format');
    }

    // Check for valid Perplexity key format
    if (credentials.perplexity && !credentials.perplexity.startsWith('pplx-')) {
      throw new Error('Invalid Perplexity API key format');
    }

    // Check key lengths
    if (credentials.gemini && credentials.gemini.length < 32) {
      throw new Error('Gemini API key too short');
    }

    if (credentials.perplexity && credentials.perplexity.length < 40) {
      throw new Error('Perplexity API key too short');
    }

    // Check for test/dummy keys
    const dummyPatterns = [
      'test', 'demo', 'example', 'placeholder', 'dummy', 'fake',
      'AIzaSyDummy', 'pplx-dummy', '123456', 'abcdef'
    ];

    Object.values(credentials).forEach(key => {
      if (key && dummyPatterns.some(pattern => key.toLowerCase().includes(pattern))) {
        throw new Error('Dummy or test API key detected');
      }
    });
  }

  /**
   * Load credentials from secure storage
   */
  private async loadCredentialsFromSecureStorage(): Promise<APICredentials | null> {
    try {
      const storedData = sessionStorage.getItem(this.STORAGE_KEY);
      if (!storedData || !this.encryptionKey) return null;

      const secureStorage: SecureCredentialStorage = JSON.parse(storedData);
      
      // Decrypt credentials
      const decryptedData = await decryptData(
        secureStorage.encryptedCredentials, 
        this.encryptionKey
      );
      
      const credentials: APICredentials = JSON.parse(decryptedData);
      
      // Verify checksum
      const currentChecksum = await secureHash(JSON.stringify(credentials));
      if (currentChecksum !== secureStorage.checksum) {
        throw new Error('Credential integrity check failed');
      }

      // Cache in memory
      this.memoryCredentials = credentials;
      
      return credentials;
    } catch (error) {
      console.error('Failed to load credentials from secure storage:', error);
      // Clear corrupted data
      sessionStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  /**
   * Generate session encryption key
   */
  private async generateSessionKey(): Promise<string> {
    const array = new Uint8Array(this.ENCRYPTION_KEY_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Derive encryption key from user PIN
   */
  private async deriveEncryptionKey(userPin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(userPin + 'asr-got-salt-2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate unique key ID for tracking
   */
  private generateKeyId(key: string): string {
    const prefix = key.substring(0, 8);
    const suffix = key.substring(key.length - 4);
    const timestamp = Date.now().toString(36);
    return `${prefix}***${suffix}_${timestamp}`;
  }

  /**
   * Check if current session is valid
   */
  private isSessionValid(): boolean {
    if (!this.sessionStartTime || !this.encryptionKey) return false;
    
    const elapsed = Date.now() - this.sessionStartTime;
    return elapsed < this.MAX_SESSION_TIME;
  }

  /**
   * Set up automatic session cleanup
   */
  private setupSessionCleanup(): void {
    // Clear session on page unload
    window.addEventListener('beforeunload', () => {
      this.clearMemoryCredentials();
    });

    // Set up session timeout
    setTimeout(() => {
      if (this.isSessionValid()) return;
      this.clearSession();
    }, this.MAX_SESSION_TIME);

    // Clear session on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Clear memory credentials when tab becomes hidden
        setTimeout(() => {
          if (document.hidden) {
            this.clearMemoryCredentials();
          }
        }, 30000); // 30 seconds
      }
    });
  }

  /**
   * Clear memory credentials only
   */
  private clearMemoryCredentials(): void {
    this.memoryCredentials = null;
  }

  /**
   * Clear any insecure credential storage
   */
  private clearInsecureStorage(): void {
    // List of known insecure storage keys
    const insecureKeys = [
      'asr-got-credentials',
      'asr-got-api-credentials', 
      'asr-got-credentials-encrypted', // Old implementation
      'gemini-api-key',
      'perplexity-api-key',
      'api-keys',
      'credentials'
    ];

    // Clear from both localStorage and sessionStorage
    insecureKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Clear any keys containing 'api' or 'key' (broad cleanup)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.toLowerCase().includes('api') || key.toLowerCase().includes('key'))) {
        // Only remove if it looks like a credential storage key
        if (key.includes('credential') || key.includes('token') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      }
    }

    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && (key.toLowerCase().includes('api') || key.toLowerCase().includes('key'))) {
        if (key.includes('credential') || key.includes('token') || key.includes('auth')) {
          sessionStorage.removeItem(key);
        }
      }
    }

    console.log('🔒 Cleared insecure credential storage');
  }

  /**
   * Export credentials for migration (encrypted)
   */
  async exportCredentialsSecurely(userPin: string): Promise<string | null> {
    try {
      const credentials = await this.getCredentials();
      if (!credentials) return null;

      const exportKey = await this.deriveEncryptionKey(userPin + 'export');
      return await encryptData(JSON.stringify(credentials), exportKey);
    } catch (error) {
      console.error('Failed to export credentials:', error);
      return null;
    }
  }

  /**
   * Import credentials from encrypted export
   */
  async importCredentialsSecurely(encryptedData: string, userPin: string): Promise<boolean> {
    try {
      const importKey = await this.deriveEncryptionKey(userPin + 'export');
      const decryptedData = await decryptData(encryptedData, importKey);
      const credentials: APICredentials = JSON.parse(decryptedData);
      
      return await this.storeCredentials(credentials);
    } catch (error) {
      console.error('Failed to import credentials:', error);
      return false;
    }
  }
}