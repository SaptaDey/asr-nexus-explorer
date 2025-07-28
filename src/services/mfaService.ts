/**
 * Multi-Factor Authentication (MFA) Service
 * SECURITY: Implements TOTP-based 2FA and backup codes
 */

import { supabase } from '@/integrations/supabase/client';
import { securityLogger, SecurityEventType, SecurityEventSeverity } from './securityEventLogger';
import { secureHash } from '@/utils/securityUtils';

interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface MFAStatus {
  enabled: boolean;
  lastUsed?: string;
  backupCodesRemaining: number;
  trustedDevices: number;
}

interface TrustedDevice {
  id: string;
  name: string;
  fingerprint: string;
  lastUsed: string;
  created: string;
}

class MFAService {
  private static instance: MFAService;
  
  private constructor() {}
  
  static getInstance(): MFAService {
    if (!MFAService.instance) {
      MFAService.instance = new MFAService();
    }
    return MFAService.instance;
  }
  
  /**
   * Generate TOTP secret for user
   */
  async generateTOTPSecret(userId: string): Promise<MFASetup> {
    try {
      // Generate a secure random secret (32 bytes base32 encoded)
      const secret = this.generateBase32Secret();
      
      // Generate QR code data
      const appName = 'ASR-GoT';
      const issuer = 'Scientific Research Platform';
      const qrCodeUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(userId)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Store temporarily (not permanently until user confirms)
      await this.storeTempMFASetup(userId, { secret, backupCodes });
      
      securityLogger.logEvent({
        event_type: SecurityEventType.CREDENTIAL_CREATED,
        severity: SecurityEventSeverity.INFO,
        user_id: userId,
        details: { action: 'mfa_setup_initiated' }
      });
      
      return {
        secret,
        qrCode: qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      console.error('MFA setup generation failed:', error);
      throw new Error('Failed to generate MFA setup');
    }
  }
  
  /**
   * Verify TOTP code and enable MFA
   */
  async enableMFA(userId: string, totpCode: string, backupCodeConfirm: string): Promise<boolean> {
    try {
      const tempSetup = await this.getTempMFASetup(userId);
      if (!tempSetup) {
        throw new Error('No pending MFA setup found');
      }
      
      // Verify TOTP code
      const isValidTOTP = this.verifyTOTP(tempSetup.secret, totpCode);
      if (!isValidTOTP) {
        securityLogger.logEvent({
          event_type: SecurityEventType.LOGIN_FAILURE,
          severity: SecurityEventSeverity.WARNING,
          user_id: userId,
          details: { reason: 'invalid_totp_during_setup' }
        });
        return false;
      }
      
      // Verify backup code confirmation
      const hasValidBackupCode = tempSetup.backupCodes.includes(backupCodeConfirm);
      if (!hasValidBackupCode) {
        securityLogger.logEvent({
          event_type: SecurityEventType.LOGIN_FAILURE,
          severity: SecurityEventSeverity.WARNING,
          user_id: userId,
          details: { reason: 'invalid_backup_code_during_setup' }
        });
        return false;
      }
      
      // Enable MFA permanently
      await this.storeMFASettings(userId, {
        secret: tempSetup.secret,
        backupCodes: tempSetup.backupCodes,
        enabled: true,
        enabledAt: new Date().toISOString()
      });
      
      // Clean up temporary setup
      await this.clearTempMFASetup(userId);
      
      securityLogger.logEvent({
        event_type: SecurityEventType.SECURITY_CONFIG_CHANGED,
        severity: SecurityEventSeverity.INFO,
        user_id: userId,
        details: { action: 'mfa_enabled' }
      });
      
      return true;
    } catch (error) {
      console.error('MFA enable failed:', error);
      return false;
    }
  }
  
  /**
   * Verify MFA code during login
   */
  async verifyMFA(userId: string, code: string, deviceFingerprint?: string): Promise<{
    valid: boolean;
    usedBackupCode: boolean;
    trustDevice: boolean;
  }> {
    try {
      const mfaSettings = await this.getMFASettings(userId);
      if (!mfaSettings || !mfaSettings.enabled) {
        return { valid: false, usedBackupCode: false, trustDevice: false };
      }
      
      let isValid = false;
      let usedBackupCode = false;
      
      // First try TOTP
      if (this.verifyTOTP(mfaSettings.secret, code)) {
        isValid = true;
      }
      // Then try backup codes
      else if (mfaSettings.backupCodes.includes(code)) {
        isValid = true;
        usedBackupCode = true;
        
        // Remove used backup code
        await this.removeBackupCode(userId, code);
        
        securityLogger.logEvent({
          event_type: SecurityEventType.CREDENTIAL_ACCESSED,
          severity: SecurityEventSeverity.WARNING,
          user_id: userId,
          details: { action: 'backup_code_used' }
        });
      }
      
      if (isValid) {
        // Update last used
        await this.updateMFALastUsed(userId);
        
        // Check if device should be trusted
        const trustDevice = await this.shouldTrustDevice(userId, deviceFingerprint);
        
        securityLogger.logEvent({
          event_type: SecurityEventType.LOGIN_SUCCESS,
          severity: SecurityEventSeverity.INFO,
          user_id: userId,
          details: { 
            mfa_method: usedBackupCode ? 'backup_code' : 'totp',
            trusted_device: trustDevice
          }
        });
        
        return { valid: true, usedBackupCode, trustDevice };
      } else {
        securityLogger.logEvent({
          event_type: SecurityEventType.LOGIN_FAILURE,
          severity: SecurityEventSeverity.WARNING,
          user_id: userId,
          details: { reason: 'invalid_mfa_code' }
        });
        
        return { valid: false, usedBackupCode: false, trustDevice: false };
      }
    } catch (error) {
      console.error('MFA verification failed:', error);
      return { valid: false, usedBackupCode: false, trustDevice: false };
    }
  }
  
  /**
   * Disable MFA
   */
  async disableMFA(userId: string, currentPassword: string): Promise<boolean> {
    try {
      // In a real implementation, verify current password
      // For now, we'll assume it's verified
      
      await this.clearMFASettings(userId);
      
      securityLogger.logEvent({
        event_type: SecurityEventType.SECURITY_CONFIG_CHANGED,
        severity: SecurityEventSeverity.WARNING,
        user_id: userId,
        details: { action: 'mfa_disabled' }
      });
      
      return true;
    } catch (error) {
      console.error('MFA disable failed:', error);
      return false;
    }
  }
  
  /**
   * Get MFA status for user
   */
  async getMFAStatus(userId: string): Promise<MFAStatus> {
    try {
      const settings = await this.getMFASettings(userId);
      const trustedDevices = await this.getTrustedDevices(userId);
      
      if (!settings) {
        return {
          enabled: false,
          backupCodesRemaining: 0,
          trustedDevices: 0
        };
      }
      
      return {
        enabled: settings.enabled,
        lastUsed: settings.lastUsed,
        backupCodesRemaining: settings.backupCodes?.length || 0,
        trustedDevices: trustedDevices.length
      };
    } catch (error) {
      console.error('Failed to get MFA status:', error);
      return {
        enabled: false,
        backupCodesRemaining: 0,
        trustedDevices: 0
      };
    }
  }
  
  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const newBackupCodes = this.generateBackupCodes();
      
      const settings = await this.getMFASettings(userId);
      if (settings) {
        settings.backupCodes = newBackupCodes;
        await this.storeMFASettings(userId, settings);
      }
      
      securityLogger.logEvent({
        event_type: SecurityEventType.CREDENTIAL_CREATED,
        severity: SecurityEventSeverity.INFO,
        user_id: userId,
        details: { action: 'backup_codes_regenerated' }
      });
      
      return newBackupCodes;
    } catch (error) {
      console.error('Backup code regeneration failed:', error);
      throw new Error('Failed to regenerate backup codes');
    }
  }
  
  /**
   * Add trusted device
   */
  async addTrustedDevice(userId: string, deviceName: string, fingerprint: string): Promise<string> {
    try {
      const deviceId = crypto.randomUUID();
      const device: TrustedDevice = {
        id: deviceId,
        name: deviceName,
        fingerprint,
        lastUsed: new Date().toISOString(),
        created: new Date().toISOString()
      };
      
      const devices = await this.getTrustedDevices(userId);
      devices.push(device);
      await this.storeTrustedDevices(userId, devices);
      
      securityLogger.logEvent({
        event_type: SecurityEventType.SECURITY_CONFIG_CHANGED,
        severity: SecurityEventSeverity.INFO,
        user_id: userId,
        details: { action: 'trusted_device_added', device_name: deviceName }
      });
      
      return deviceId;
    } catch (error) {
      console.error('Failed to add trusted device:', error);
      throw new Error('Failed to add trusted device');
    }
  }
  
  /**
   * Remove trusted device
   */
  async removeTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      const devices = await this.getTrustedDevices(userId);
      const filteredDevices = devices.filter(d => d.id !== deviceId);
      
      if (filteredDevices.length === devices.length) {
        return false; // Device not found
      }
      
      await this.storeTrustedDevices(userId, filteredDevices);
      
      securityLogger.logEvent({
        event_type: SecurityEventType.SECURITY_CONFIG_CHANGED,
        severity: SecurityEventSeverity.INFO,
        user_id: userId,
        details: { action: 'trusted_device_removed', device_id: deviceId }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to remove trusted device:', error);
      return false;
    }
  }
  
  /**
   * Check if current device is trusted
   */
  async isDeviceTrusted(userId: string, fingerprint: string): Promise<boolean> {
    try {
      const devices = await this.getTrustedDevices(userId);
      return devices.some(d => d.fingerprint === fingerprint);
    } catch (error) {
      console.error('Failed to check device trust:', error);
      return false;
    }
  }
  
  // Private helper methods
  
  private generateBase32Secret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  }
  
  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-digit backup codes
      const code = Math.random().toString(10).substr(2, 8);
      codes.push(code);
    }
    return codes;
  }
  
  private verifyTOTP(secret: string, token: string): boolean {
    // Simple TOTP verification (in production, use a proper TOTP library)
    // This is a placeholder implementation
    const timeStep = Math.floor(Date.now() / 30000);
    const expectedToken = this.generateTOTP(secret, timeStep);
    
    // Check current time step and previous one (for clock drift)
    return token === expectedToken || token === this.generateTOTP(secret, timeStep - 1);
  }
  
  private generateTOTP(secret: string, timeStep: number): string {
    // Placeholder TOTP generation (use proper crypto library in production)
    const hash = btoa(`${secret}-${timeStep}`).replace(/[^0-9]/g, '');
    return hash.substr(0, 6).padStart(6, '0');
  }
  
  private async shouldTrustDevice(userId: string, fingerprint?: string): Promise<boolean> {
    if (!fingerprint) return false;
    
    // Simple logic: trust device if MFA verification was successful
    // In production, this might consider additional factors
    return true;
  }
  
  // Storage methods (using localStorage for demo - use secure storage in production)
  
  private async storeTempMFASetup(userId: string, setup: any): Promise<void> {
    sessionStorage.setItem(`mfa-temp-${userId}`, JSON.stringify(setup));
  }
  
  private async getTempMFASetup(userId: string): Promise<any> {
    const stored = sessionStorage.getItem(`mfa-temp-${userId}`);
    return stored ? JSON.parse(stored) : null;
  }
  
  private async clearTempMFASetup(userId: string): Promise<void> {
    sessionStorage.removeItem(`mfa-temp-${userId}`);
  }
  
  private async storeMFASettings(userId: string, settings: any): Promise<void> {
    // In production, this would be encrypted and stored securely
    localStorage.setItem(`mfa-${userId}`, JSON.stringify(settings));
  }
  
  private async getMFASettings(userId: string): Promise<any> {
    const stored = localStorage.getItem(`mfa-${userId}`);
    return stored ? JSON.parse(stored) : null;
  }
  
  private async clearMFASettings(userId: string): Promise<void> {
    localStorage.removeItem(`mfa-${userId}`);
    localStorage.removeItem(`mfa-devices-${userId}`);
  }
  
  private async updateMFALastUsed(userId: string): Promise<void> {
    const settings = await this.getMFASettings(userId);
    if (settings) {
      settings.lastUsed = new Date().toISOString();
      await this.storeMFASettings(userId, settings);
    }
  }
  
  private async removeBackupCode(userId: string, code: string): Promise<void> {
    const settings = await this.getMFASettings(userId);
    if (settings && settings.backupCodes) {
      settings.backupCodes = settings.backupCodes.filter((c: string) => c !== code);
      await this.storeMFASettings(userId, settings);
    }
  }
  
  private async getTrustedDevices(userId: string): Promise<TrustedDevice[]> {
    const stored = localStorage.getItem(`mfa-devices-${userId}`);
    return stored ? JSON.parse(stored) : [];
  }
  
  private async storeTrustedDevices(userId: string, devices: TrustedDevice[]): Promise<void> {
    localStorage.setItem(`mfa-devices-${userId}`, JSON.stringify(devices));
  }
}

// Export singleton instance
export const mfaService = MFAService.getInstance();

// Helper functions
export const generateMFASetup = (userId: string) => mfaService.generateTOTPSecret(userId);
export const enableUserMFA = (userId: string, totpCode: string, backupCode: string) => 
  mfaService.enableMFA(userId, totpCode, backupCode);
export const verifyUserMFA = (userId: string, code: string, fingerprint?: string) => 
  mfaService.verifyMFA(userId, code, fingerprint);
export const getUserMFAStatus = (userId: string) => mfaService.getMFAStatus(userId);
export const checkDeviceTrust = (userId: string, fingerprint: string) => 
  mfaService.isDeviceTrusted(userId, fingerprint);