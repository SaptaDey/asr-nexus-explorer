/**
 * Password Policy Service
 * SECURITY: Enforces strong password requirements and breach detection
 */

import { securityLogger, SecurityEventType, SecurityEventSeverity } from './securityEventLogger';
import { secureHash } from '@/utils/securityUtils';

interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minSpecialChars: number;
  preventCommonPasswords: boolean;
  preventPersonalInfo: boolean;
  preventReuse: number; // Number of previous passwords to check
  maxAge: number; // Days before password expires
  complexity: 'basic' | 'standard' | 'high' | 'maximum';
}

interface PasswordStrength {
  score: number; // 0-100
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  passesPolicy: boolean;
  estimatedCrackTime: string;
}

interface PasswordValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  strength: PasswordStrength;
}

class PasswordPolicyService {
  private static instance: PasswordPolicyService;
  
  private readonly policies: Record<string, PasswordPolicy> = {
    basic: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: false,
      requireLowercase: true,
      requireNumbers: false,
      requireSpecialChars: false,
      minSpecialChars: 0,
      preventCommonPasswords: true,
      preventPersonalInfo: false,
      preventReuse: 0,
      maxAge: 365,
      complexity: 'basic'
    },
    standard: {
      minLength: 10,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      minSpecialChars: 0,
      preventCommonPasswords: true,
      preventPersonalInfo: true,
      preventReuse: 3,
      maxAge: 180,
      complexity: 'standard'
    },
    high: {
      minLength: 12,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      minSpecialChars: 1,
      preventCommonPasswords: true,
      preventPersonalInfo: true,
      preventReuse: 5,
      maxAge: 90,
      complexity: 'high'
    },
    maximum: {
      minLength: 16,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      minSpecialChars: 2,
      preventCommonPasswords: true,
      preventPersonalInfo: true,
      preventReuse: 10,
      maxAge: 60,
      complexity: 'maximum'
    }
  };
  
  // Common passwords from breach databases (truncated for demo)
  private readonly commonPasswords = new Set([
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
    'qwerty123', 'welcome123', 'admin123', 'root', 'toor', 'pass',
    'guest', 'test', 'demo', 'temp', 'changeme', 'default'
  ]);
  
  private constructor() {}
  
  static getInstance(): PasswordPolicyService {
    if (!PasswordPolicyService.instance) {
      PasswordPolicyService.instance = new PasswordPolicyService();
    }
    return PasswordPolicyService.instance;
  }
  
  /**
   * Get password policy for organization/user
   */
  getPasswordPolicy(policyLevel: string = 'high'): PasswordPolicy {
    return this.policies[policyLevel] || this.policies.high;
  }
  
  /**
   * Validate password against policy
   */
  async validatePassword(
    password: string, 
    userInfo?: { email?: string; name?: string; username?: string },
    policyLevel: string = 'high'
  ): Promise<PasswordValidation> {
    const policy = this.getPasswordPolicy(policyLevel);
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic length check
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }
    
    if (password.length > policy.maxLength) {
      errors.push(`Password must not exceed ${policy.maxLength} characters`);
    }
    
    // Character requirements
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (policy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (policy.requireSpecialChars) {
      const specialChars = password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g);
      if (!specialChars || specialChars.length < policy.minSpecialChars) {
        errors.push(`Password must contain at least ${policy.minSpecialChars} special character(s)`);
      }
    }
    
    // Common password check
    if (policy.preventCommonPasswords) {
      const lowerPassword = password.toLowerCase();
      if (this.commonPasswords.has(lowerPassword)) {
        errors.push('Password is too common and easily guessable');
      }
      
      // Check for common patterns
      if (this.isCommonPattern(password)) {
        errors.push('Password follows a common pattern and is easily guessable');
      }
    }
    
    // Personal information check
    if (policy.preventPersonalInfo && userInfo) {
      const personalInfo = [
        userInfo.email?.split('@')[0],
        userInfo.name,
        userInfo.username
      ].filter(Boolean);
      
      for (const info of personalInfo) {
        if (info && password.toLowerCase().includes(info.toLowerCase())) {
          errors.push('Password must not contain personal information');
          break;
        }
      }
    }
    
    // Password breach check
    const isBreached = await this.checkPasswordBreach(password);
    if (isBreached) {
      errors.push('This password has been found in data breaches and should not be used');
    }
    
    // Calculate password strength
    const strength = this.calculatePasswordStrength(password);
    
    // Additional warnings based on strength
    if (strength.score < 60) {
      warnings.push('Consider using a stronger password');
    }
    
    if (password.length < 12) {
      warnings.push('Passwords with 12+ characters are more secure');
    }
    
    // Log password validation attempt
    securityLogger.logEvent({
      event_type: SecurityEventType.SECURITY_CONFIG_CHANGED,
      severity: errors.length > 0 ? SecurityEventSeverity.WARNING : SecurityEventSeverity.INFO,
      details: {
        action: 'password_validation',
        policy_level: policyLevel,
        strength_score: strength.score,
        has_errors: errors.length > 0,
        breached: isBreached
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      strength,
      passesPolicy: errors.length === 0
    };
  }
  
  /**
   * Calculate password strength score
   */
  calculatePasswordStrength(password: string): PasswordStrength {
    let score = 0;
    const feedback: string[] = [];
    
    // Length bonus
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 5;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/[0-9]/.test(password)) score += 5;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10;
    
    // Pattern detection
    if (this.hasRepeatingChars(password)) {
      score -= 10;
      feedback.push('Avoid repeating characters');
    }
    
    if (this.hasSequentialChars(password)) {
      score -= 15;
      feedback.push('Avoid sequential characters (abc, 123)');
    }
    
    if (this.hasKeyboardPatterns(password)) {
      score -= 10;
      feedback.push('Avoid keyboard patterns (qwerty, asdf)');
    }
    
    // Bonus for mixed case within words
    if (/[a-z].*[A-Z]|[A-Z].*[a-z]/.test(password)) {
      score += 5;
    }
    
    // Bonus for numbers not at the end
    if (/[0-9]/.test(password) && !/[0-9]+$/.test(password)) {
      score += 5;
    }
    
    // Entropy bonus
    const entropy = this.calculateEntropy(password);
    if (entropy > 40) score += 10;
    if (entropy > 60) score += 10;
    
    // Cap score at 100
    score = Math.min(100, Math.max(0, score));
    
    // Determine level
    let level: PasswordStrength['level'];
    if (score < 20) level = 'very-weak';
    else if (score < 40) level = 'weak';
    else if (score < 60) level = 'fair';
    else if (score < 80) level = 'good';
    else if (score < 95) level = 'strong';
    else level = 'very-strong';
    
    // Estimate crack time
    const estimatedCrackTime = this.estimateCrackTime(password, entropy);
    
    // Add constructive feedback
    if (password.length < 12) {
      feedback.push('Use at least 12 characters for better security');
    }
    if (!/[A-Z]/.test(password)) {
      feedback.push('Add uppercase letters');
    }
    if (!/[a-z]/.test(password)) {
      feedback.push('Add lowercase letters');
    }
    if (!/[0-9]/.test(password)) {
      feedback.push('Add numbers');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Add special characters');
    }
    
    return {
      score,
      level,
      feedback,
      passesPolicy: score >= 60,
      estimatedCrackTime
    };
  }
  
  /**
   * Check if password has been in data breaches
   */
  private async checkPasswordBreach(password: string): Promise<boolean> {
    try {
      // Hash the password
      const hash = await secureHash(password);
      const hashPrefix = hash.substring(0, 5);
      
      // In a real implementation, this would query HaveIBeenPwned API
      // For demo purposes, we'll simulate with common passwords
      const lowerPassword = password.toLowerCase();
      
      // Check against our local common passwords list
      if (this.commonPasswords.has(lowerPassword)) {
        return true;
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // For demo: mark obviously weak passwords as breached
      const weakPatterns = [
        /password/i,
        /123456/,
        /qwerty/i,
        /admin/i,
        /welcome/i
      ];
      
      return weakPatterns.some(pattern => pattern.test(password));
    } catch (error) {
      console.error('Breach check failed:', error);
      return false; // Fail open for availability
    }
  }
  
  /**
   * Generate a secure password
   */
  generateSecurePassword(length: number = 16, includeSymbols: boolean = true): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let charset = lowercase + uppercase + numbers;
    if (includeSymbols) {
      charset += symbols;
    }
    
    let password = '';
    
    // Ensure at least one character from each required set
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    if (includeSymbols) {
      password += symbols[Math.floor(Math.random() * symbols.length)];
    }
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
  
  /**
   * Check password history for reuse
   */
  async checkPasswordReuse(userId: string, newPassword: string, policy: PasswordPolicy): Promise<boolean> {
    if (policy.preventReuse === 0) return false;
    
    try {
      const passwordHistory = await this.getPasswordHistory(userId);
      const newPasswordHash = await secureHash(newPassword);
      
      // Check against recent passwords
      const recentHashes = passwordHistory.slice(0, policy.preventReuse);
      return recentHashes.includes(newPasswordHash);
    } catch (error) {
      console.error('Password reuse check failed:', error);
      return false; // Fail open
    }
  }
  
  /**
   * Store password hash in history
   */
  async storePasswordHash(userId: string, passwordHash: string): Promise<void> {
    try {
      const history = await this.getPasswordHistory(userId);
      history.unshift(passwordHash);
      
      // Keep only last 15 passwords
      const trimmedHistory = history.slice(0, 15);
      
      localStorage.setItem(`pwd-history-${userId}`, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Failed to store password hash:', error);
    }
  }
  
  // Private helper methods
  
  private isCommonPattern(password: string): boolean {
    // Check for common patterns
    const patterns = [
      /^(.)\1{2,}$/, // Repeating single character
      /(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,
      /^(password|admin|login|user|guest|test|demo|temp|root|administrator|welcome)\d*$/i,
      /(qwerty|asdfgh|zxcvbn|qazwsx|1234567890)/i
    ];
    
    return patterns.some(pattern => pattern.test(password));
  }
  
  private hasRepeatingChars(password: string): boolean {
    return /(.)\1{2,}/.test(password);
  }
  
  private hasSequentialChars(password: string): boolean {
    const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', '9876543210', 'zyxwvutsrqponmlkjihgfedcba'];
    
    for (const seq of sequences) {
      for (let i = 0; i <= seq.length - 3; i++) {
        if (password.toLowerCase().includes(seq.substr(i, 3))) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  private hasKeyboardPatterns(password: string): boolean {
    const patterns = ['qwerty', 'asdfgh', 'zxcvbn', 'qazwsx', 'wsxedc'];
    const lowerPassword = password.toLowerCase();
    
    return patterns.some(pattern => lowerPassword.includes(pattern));
  }
  
  private calculateEntropy(password: string): number {
    const charsets = {
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /[0-9]/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    let charsetSize = 0;
    if (charsets.lowercase) charsetSize += 26;
    if (charsets.uppercase) charsetSize += 26;
    if (charsets.numbers) charsetSize += 10;
    if (charsets.symbols) charsetSize += 32;
    
    return password.length * Math.log2(charsetSize);
  }
  
  private estimateCrackTime(password: string, entropy: number): string {
    // Rough estimation based on entropy
    const attemptsPerSecond = 1e9; // 1 billion attempts per second (GPU)
    const totalCombinations = Math.pow(2, entropy);
    const averageAttempts = totalCombinations / 2;
    const secondsToCrack = averageAttempts / attemptsPerSecond;
    
    if (secondsToCrack < 60) return 'Less than 1 minute';
    if (secondsToCrack < 3600) return `${Math.round(secondsToCrack / 60)} minutes`;
    if (secondsToCrack < 86400) return `${Math.round(secondsToCrack / 3600)} hours`;
    if (secondsToCrack < 31536000) return `${Math.round(secondsToCrack / 86400)} days`;
    if (secondsToCrack < 31536000000) return `${Math.round(secondsToCrack / 31536000)} years`;
    return 'Centuries';
  }
  
  private async getPasswordHistory(userId: string): Promise<string[]> {
    try {
      const stored = localStorage.getItem(`pwd-history-${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const passwordPolicy = PasswordPolicyService.getInstance();

// Helper functions
export const validateUserPassword = (password: string, userInfo?: any, policyLevel?: string) =>
  passwordPolicy.validatePassword(password, userInfo, policyLevel);

export const generateStrongPassword = (length?: number, includeSymbols?: boolean) =>
  passwordPolicy.generateSecurePassword(length, includeSymbols);

export const getPasswordStrength = (password: string) =>
  passwordPolicy.calculatePasswordStrength(password);

export const checkPasswordHistory = (userId: string, password: string) =>
  passwordPolicy.checkPasswordReuse(userId, password, passwordPolicy.getPasswordPolicy());