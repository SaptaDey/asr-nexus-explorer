/**
 * Security Utilities for ASR-GoT Framework
 * Provides secure handling of user input, API responses, and credential management
 */

import DOMPurify from 'dompurify';

// Input validation schemas
export const INPUT_VALIDATION = {
  maxQueryLength: 1048576, // Gemini 2.5 Pro input limit: 1,048,576 tokens
  maxTokens: 65536, // Gemini 2.5 Pro output limit: 65,536 tokens
  allowedModels: ['sonar-reasoning-pro', 'gemini-2.5-pro'],
  maxFileSize: 50 * 1024 * 1024, // 50MB - increased for large research data
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote'],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true,
  });
};

/**
 * Validate and sanitize user input
 */
export const validateInput = (input: string, type: 'query' | 'prompt'): string => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input: must be a non-empty string');
  }

  // Remove potentially dangerous characters
  const sanitized = input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();

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
 * Simple encryption for client-side credential storage (DEPRECATED)
 * Note: This is obfuscation, not true security - use encryptData instead
 */
export const encryptCredentials = (credentials: string): string => {
  console.warn('encryptCredentials is deprecated, use encryptData instead');
  const encoder = new TextEncoder();
  const data = encoder.encode(credentials);
  const encrypted = Array.from(data).map(byte => byte ^ 42).map(byte => byte.toString(16).padStart(2, '0')).join('');
  return btoa(encrypted);
};

export const decryptCredentials = (encrypted: string): string => {
  try {
    const decoded = atob(encrypted);
    const bytes = decoded.match(/.{2}/g)?.map(hex => parseInt(hex, 16) ^ 42) || [];
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(bytes));
  } catch (error) {
    throw new Error('Failed to decrypt credentials');
  }
};

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
 * Rate limiting implementation
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests = 10, timeWindowMs = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the time window
    const validRequests = requests.filter(time => now - time < this.timeWindow);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
}

export const apiRateLimiter = new RateLimiter(30, 60000); // 30 requests per minute