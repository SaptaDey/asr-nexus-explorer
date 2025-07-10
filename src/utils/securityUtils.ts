/**
 * Security Utilities for ASR-GoT Framework
 * Provides secure handling of user input, API responses, and credential management
 */

import DOMPurify from 'dompurify';

// Input validation schemas
export const INPUT_VALIDATION = {
  maxQueryLength: 1048576, // Updated to Gemini 2.5 Pro max input token limit
  maxTokens: 1048576, // Updated to Gemini 2.5 Pro max input token limit
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
 * Simple encryption for client-side credential storage
 * Note: This is obfuscation, not true security - server-side encryption is preferred
 */
export const encryptCredentials = (credentials: string): string => {
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