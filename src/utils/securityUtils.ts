/**
 * Security Utilities for ASR-GoT Framework
 * Provides secure handling of user input, API responses, and credential management
 */

import DOMPurify from 'dompurify';
import { logSecurityViolation } from '@/services/securityEventLogger';

// Input validation schemas
export const INPUT_VALIDATION = {
  maxQueryLength: 1048576, // Gemini 2.5 Pro input limit: 1,048,576 tokens
  maxTokens: 65536, // Gemini 2.5 Pro output limit: 65,536 tokens
  allowedModels: ['sonar-reasoning-pro', 'gemini-2.5-pro'],
  maxFileSize: 50 * 1024 * 1024, // 50MB - increased for large research data
};

/**
 * SECURITY ENHANCED: Sanitize HTML content to prevent XSS attacks
 * Uses comprehensive DOMPurify configuration for research content safety
 */
export const sanitizeHTML = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  try {
    const sanitized = DOMPurify.sanitize(html, {
      // Allowed tags for research content
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'div', 'span',
        'strong', 'b', 'em', 'i', 'u',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'a', 'img',
        'sub', 'sup'
      ],
      
      // Allowed attributes with security restrictions
      ALLOWED_ATTR: [
        'href', 'title', 'alt', 'src',
        'class', 'id',
        'target', 'rel'
      ],
      
      // Block dangerous protocols
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
      
      // Security settings
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'style'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange'],
      
      // Sanitization options
      SANITIZE_DOM: true,
      SANITIZE_NAMED_PROPS: true,
      KEEP_CONTENT: true,
      
      // Add hooks for additional security
      ADD_TAGS: [],
      ADD_ATTR: []
    });
    
    // Additional validation to catch any remaining threats
    if (sanitized.includes('<script') || sanitized.includes('javascript:') || sanitized.includes('data:text/html')) {
      console.warn('SECURITY: Potential XSS attempt blocked in HTML content');
      logSecurityViolation('xss', { 
        originalLength: html.length, 
        blockedContent: html.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });
      return 'Content blocked for security reasons';
    }
    
    return sanitized;
  } catch (error) {
    console.error('SECURITY: HTML sanitization failed:', error);
    return 'Content could not be safely displayed';
  }
};

/**
 * Validate and sanitize user input
 */
export const validateInput = (input: string, type: 'query' | 'prompt'): string => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input: must be a non-empty string');
  }

  // Remove potentially dangerous characters
  const originalInput = input;
  const sanitized = input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
    
  // Log if content was modified
  if (originalInput !== sanitized) {
    logSecurityViolation('input', {
      type,
      originalLength: originalInput.length,
      sanitizedLength: sanitized.length,
      removedPatterns: originalInput.length - sanitized.length > 0
    });
  }

  if (sanitized.length > INPUT_VALIDATION.maxQueryLength) {
    throw new Error(`Input too long: maximum ${INPUT_VALIDATION.maxQueryLength} characters`);
  }

  if (sanitized.length === 0) {
    throw new Error('Input cannot be empty after sanitization');
  }

  return sanitized;
};

/**
 * Validate API key format
 */
export const validateAPIKey = (key: string, provider: 'perplexity' | 'gemini'): boolean => {
  if (!key || typeof key !== 'string') return false;

  switch (provider) {
    case 'perplexity':
      return key.startsWith('pplx-') && key.length > 20;
    case 'gemini':
      return key.startsWith('AIza') && key.length > 30;
    default:
      return false;
  }
};

/**
 * Secure encryption using Web Crypto API
 */
export const encryptData = async (data: string, key: string): Promise<string> => {
  try {
    // Convert key to CryptoKey
    const keyData = new TextEncoder().encode(key.slice(0, 32).padEnd(32, '0'));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt data
    const encodedData = new TextEncoder().encode(data);
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encodedData
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Secure decryption using Web Crypto API
 */
export const decryptData = async (encryptedData: string, key: string): Promise<string> => {
  try {
    // Convert key to CryptoKey
    const keyData = new TextEncoder().encode(key.slice(0, 32).padEnd(32, '0'));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Convert from base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // Decrypt data
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encrypted
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Generate secure hash for integrity checking
 */
export const secureHash = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * SECURITY: These deprecated functions have been REMOVED for security reasons
 * They provided only weak obfuscation, not real encryption
 * Use SecureCredentialManager.getInstance() methods instead
 * 
 * If you need credential storage, use:
 * - SecureCredentialManager.getInstance().storeCredentials()
 * - SecureCredentialManager.getInstance().getCredentials()
 */

/**
 * Safe JSON parsing for AI-generated content
 */
export const safeJSONParse = (jsonString: string, allowedKeys: string[]): any => {
  try {
    // Remove code block markers if present
    const cleanedJson = jsonString
      .replace(/```(?:json|javascript)?\s*/, '')
      .replace(/```\s*$/, '')
      .trim();

    const parsed = JSON.parse(cleanedJson);

    // Validate that only allowed keys are present
    if (typeof parsed === 'object' && parsed !== null) {
      const keys = Object.keys(parsed);
      const invalidKeys = keys.filter(key => !allowedKeys.includes(key));
      
      if (invalidKeys.length > 0) {
        throw new Error(`Invalid keys found: ${invalidKeys.join(', ')}`);
      }
    }

    return parsed;
  } catch (error) {
    throw new Error(`JSON parsing failed: ${error}`);
  }
};

/**
 * Validate Plotly configuration for safe rendering
 */
export const validatePlotlyConfig = (config: any): boolean => {
  const allowedTraceTypes = ['scatter', 'bar', 'histogram', 'box', 'heatmap', 'pie', 'line'];
  const requiredKeys = ['data', 'layout'];
  
  // Check required keys
  for (const key of requiredKeys) {
    if (!(key in config)) {
      return false;
    }
  }

  // Validate data traces
  if (!Array.isArray(config.data)) {
    return false;
  }

  for (const trace of config.data) {
    if (trace.type && !allowedTraceTypes.includes(trace.type)) {
      return false;
    }
  }

  return true;
};

/**
 * Enhanced Rate Limiting Implementation with Multiple Strategies
 */

interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number;
  burstAllowance?: number;
  priority?: 'low' | 'normal' | 'high';
}

interface RateLimitState {
  requests: number[];
  burstTokens: number;
  lastRefill: number;
  consecutiveViolations: number;
  backoffUntil?: number;
}

class EnhancedRateLimiter {
  private states: Map<string, RateLimitState> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();
  private globalState = { 
    requests: [] as number[], 
    lastCleanup: Date.now() 
  };

  constructor() {
    // Initialize default rate limit configurations
    this.setupDefaultConfigs();
    
    // Cleanup old entries periodically
    setInterval(() => this.cleanup(), 300000); // Every 5 minutes
  }

  private setupDefaultConfigs() {
    // API-specific rate limits based on provider limits
    this.configs.set('gemini', {
      maxRequests: 15, // Conservative limit for Gemini
      timeWindow: 60000, // 1 minute
      burstAllowance: 5,
      priority: 'high'
    });

    this.configs.set('perplexity', {
      maxRequests: 20, // Conservative limit for Perplexity
      timeWindow: 60000,
      burstAllowance: 3,
      priority: 'high'
    });

    this.configs.set('gemini-api', {
      maxRequests: 10,
      timeWindow: 60000,
      burstAllowance: 2,
      priority: 'normal'
    });

    // User-based rate limits
    this.configs.set('user-global', {
      maxRequests: 100, // 100 requests per hour per user
      timeWindow: 3600000, // 1 hour
      burstAllowance: 20,
      priority: 'normal'
    });

    // Cost-aware limits
    this.configs.set('cost-heavy', {
      maxRequests: 5,
      timeWindow: 300000, // 5 minutes
      burstAllowance: 1,
      priority: 'low'
    });

    // Real-time operations
    this.configs.set('realtime', {
      maxRequests: 60,
      timeWindow: 60000,
      burstAllowance: 10,
      priority: 'high'
    });
  }

  /**
   * Check if a request is allowed with sophisticated rate limiting
   */
  isAllowed(identifier: string, userId?: string): boolean {
    const config = this.configs.get(identifier);
    if (!config) {
      console.warn(`No rate limit config found for ${identifier}, using default`);
      return this.basicRateLimit(identifier, 30, 60000);
    }

    // Check global rate limits first
    if (!this.checkGlobalLimit()) {
      console.warn('Global rate limit exceeded');
      return false;
    }

    const key = userId ? `${identifier}:${userId}` : identifier;
    const state = this.getOrCreateState(key, config);
    const now = Date.now();

    // Check if currently in backoff period
    if (state.backoffUntil && now < state.backoffUntil) {
      return false;
    }

    // Refill burst tokens
    this.refillBurstTokens(state, config, now);

    // Clean old requests
    state.requests = state.requests.filter(time => now - time < config.timeWindow);

    // Check rate limits with priority consideration
    const effectiveLimit = this.calculateEffectiveLimit(config, state);
    
    if (state.requests.length >= effectiveLimit) {
      // Rate limit exceeded - apply exponential backoff
      this.applyBackoff(state);
      return false;
    }

    // Check burst allowance
    if (config.burstAllowance && state.burstTokens <= 0) {
      const timeSinceLastRequest = state.requests.length > 0 
        ? now - state.requests[state.requests.length - 1]
        : config.timeWindow;
      
      if (timeSinceLastRequest < (config.timeWindow / config.maxRequests)) {
        return false;
      }
    }

    // Allow request
    state.requests.push(now);
    if (config.burstAllowance && state.burstTokens > 0) {
      state.burstTokens--;
    }
    
    // Reset violation counter on successful request
    state.consecutiveViolations = 0;
    state.backoffUntil = undefined;

    return true;
  }

  /**
   * Get rate limit status for monitoring
   */
  getStatus(identifier: string, userId?: string): {
    remaining: number;
    resetTime: number;
    burstTokens: number;
    inBackoff: boolean;
  } {
    const config = this.configs.get(identifier);
    if (!config) {
      return { remaining: 0, resetTime: 0, burstTokens: 0, inBackoff: false };
    }

    const key = userId ? `${identifier}:${userId}` : identifier;
    const state = this.states.get(key);
    const now = Date.now();

    if (!state) {
      return {
        remaining: config.maxRequests,
        resetTime: now + config.timeWindow,
        burstTokens: config.burstAllowance || 0,
        inBackoff: false
      };
    }

    const validRequests = state.requests.filter(time => now - time < config.timeWindow);
    const effectiveLimit = this.calculateEffectiveLimit(config, state);
    
    return {
      remaining: Math.max(0, effectiveLimit - validRequests.length),
      resetTime: validRequests.length > 0 
        ? validRequests[0] + config.timeWindow 
        : now + config.timeWindow,
      burstTokens: state.burstTokens,
      inBackoff: !!(state.backoffUntil && now < state.backoffUntil)
    };
  }

  /**
   * Reset rate limits for a specific identifier (admin function)
   */
  reset(identifier: string, userId?: string): void {
    const key = userId ? `${identifier}:${userId}` : identifier;
    this.states.delete(key);
  }

  /**
   * Add a new rate limit configuration
   */
  addConfig(identifier: string, config: RateLimitConfig): void {
    this.configs.set(identifier, config);
  }

  private getOrCreateState(key: string, config: RateLimitConfig): RateLimitState {
    if (!this.states.has(key)) {
      this.states.set(key, {
        requests: [],
        burstTokens: config.burstAllowance || 0,
        lastRefill: Date.now(),
        consecutiveViolations: 0
      });
    }
    return this.states.get(key)!;
  }

  private refillBurstTokens(state: RateLimitState, config: RateLimitConfig, now: number): void {
    if (!config.burstAllowance) return;

    const timeSinceLastRefill = now - state.lastRefill;
    const refillInterval = config.timeWindow / config.maxRequests;
    
    if (timeSinceLastRefill >= refillInterval) {
      const tokensToAdd = Math.floor(timeSinceLastRefill / refillInterval);
      state.burstTokens = Math.min(config.burstAllowance, state.burstTokens + tokensToAdd);
      state.lastRefill = now;
    }
  }

  private calculateEffectiveLimit(config: RateLimitConfig, state: RateLimitState): number {
    let effectiveLimit = config.maxRequests;

    // Reduce limits for users with many violations
    if (state.consecutiveViolations > 3) {
      effectiveLimit = Math.floor(effectiveLimit * 0.5);
    } else if (state.consecutiveViolations > 1) {
      effectiveLimit = Math.floor(effectiveLimit * 0.7);
    }

    // Priority-based adjustments
    if (config.priority === 'high') {
      effectiveLimit = Math.floor(effectiveLimit * 1.2);
    } else if (config.priority === 'low') {
      effectiveLimit = Math.floor(effectiveLimit * 0.8);
    }

    return Math.max(1, effectiveLimit);
  }

  private applyBackoff(state: RateLimitState): void {
    state.consecutiveViolations++;
    
    // Exponential backoff: 2^violations seconds, max 5 minutes
    const backoffMs = Math.min(
      Math.pow(2, state.consecutiveViolations) * 1000,
      300000
    );
    
    state.backoffUntil = Date.now() + backoffMs;
  }

  private checkGlobalLimit(): boolean {
    const now = Date.now();
    const globalLimit = 1000; // Global limit per minute
    const timeWindow = 60000;

    // Cleanup old global requests
    this.globalState.requests = this.globalState.requests.filter(
      time => now - time < timeWindow
    );

    if (this.globalState.requests.length >= globalLimit) {
      return false;
    }

    this.globalState.requests.push(now);
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [key, state] of this.states.entries()) {
      const hasRecentActivity = state.requests.some(time => now - time < maxAge);
      if (!hasRecentActivity && (!state.backoffUntil || now > state.backoffUntil)) {
        this.states.delete(key);
      }
    }

    // Clean global state
    if (now - this.globalState.lastCleanup > 300000) {
      this.globalState.requests = this.globalState.requests.filter(
        time => now - time < 60000
      );
      this.globalState.lastCleanup = now;
    }
  }

  private basicRateLimit(identifier: string, maxRequests: number, timeWindow: number): boolean {
    const state = this.getOrCreateState(identifier, { maxRequests, timeWindow });
    const now = Date.now();
    
    state.requests = state.requests.filter(time => now - time < timeWindow);
    
    if (state.requests.length >= maxRequests) {
      return false;
    }

    state.requests.push(now);
    return true;
  }
}

// Export enhanced rate limiter instance
export const apiRateLimiter = new EnhancedRateLimiter();