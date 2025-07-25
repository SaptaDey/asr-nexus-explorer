/**
 * API Validation Middleware
 * SECURITY: Comprehensive validation for all API endpoints
 */

import { validateInput, apiRateLimiter, INPUT_VALIDATION } from '@/utils/securityUtils';
import { sanitizeHTML } from '@/utils/securityUtils';

// Request validation schemas for different API operations
export const API_VALIDATION_SCHEMAS = {
  // User profile operations
  updateProfile: {
    fields: {
      full_name: { type: 'string', maxLength: 100, required: false },
      avatar_url: { type: 'url', maxLength: 500, required: false },
      preferences: { type: 'object', maxSize: 5000, required: false }
    }
  },
  
  // Research query operations
  createQuery: {
    fields: {
      query: { type: 'string', maxLength: INPUT_VALIDATION.maxQueryLength, required: true },
      field: { type: 'string', maxLength: 100, required: false },
      parameters: { type: 'object', maxSize: 10000, required: false }
    }
  },
  
  // API key operations
  addApiKey: {
    fields: {
      provider: { type: 'enum', values: ['gemini', 'perplexity'], required: true },
      key_name: { type: 'string', maxLength: 50, required: true },
      encrypted_key: { type: 'string', maxLength: 500, required: true }
    }
  },
  
  // Session operations
  saveSession: {
    fields: {
      session_id: { type: 'uuid', required: true },
      query: { type: 'string', maxLength: INPUT_VALIDATION.maxQueryLength, required: true },
      results: { type: 'object', maxSize: 50000, required: false },
      metadata: { type: 'object', maxSize: 5000, required: false }
    }
  }
};

/**
 * Validate request data against schema
 */
export const validateRequestData = (
  data: any,
  schemaName: keyof typeof API_VALIDATION_SCHEMAS
): { isValid: boolean; errors: string[]; sanitizedData: any } => {
  const schema = API_VALIDATION_SCHEMAS[schemaName];
  if (!schema) {
    return { isValid: false, errors: ['Invalid schema name'], sanitizedData: null };
  }

  const errors: string[] = [];
  const sanitizedData: any = {};

  // Check for unexpected fields
  const allowedFields = Object.keys(schema.fields);
  const providedFields = Object.keys(data || {});
  const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));
  
  if (unexpectedFields.length > 0) {
    errors.push(`Unexpected fields: ${unexpectedFields.join(', ')}`);
  }

  // Validate each field
  for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
    const value = data?.[fieldName];
    
    // Check required fields
    if (fieldSchema.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${fieldName}' is required`);
      continue;
    }
    
    // Skip optional empty fields
    if (!fieldSchema.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    switch (fieldSchema.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Field '${fieldName}' must be a string`);
          continue;
        }
        if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
          errors.push(`Field '${fieldName}' exceeds maximum length of ${fieldSchema.maxLength}`);
          continue;
        }
        try {
          // Sanitize string inputs
          sanitizedData[fieldName] = validateInput(value, 'prompt');
        } catch (error) {
          errors.push(`Field '${fieldName}' validation failed: ${error.message}`);
        }
        break;

      case 'url':
        if (typeof value !== 'string') {
          errors.push(`Field '${fieldName}' must be a string URL`);
          continue;
        }
        try {
          const url = new URL(value);
          if (!['http:', 'https:'].includes(url.protocol)) {
            errors.push(`Field '${fieldName}' must be an HTTP or HTTPS URL`);
            continue;
          }
          sanitizedData[fieldName] = value;
        } catch {
          errors.push(`Field '${fieldName}' must be a valid URL`);
        }
        break;

      case 'uuid':
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof value !== 'string' || !uuidRegex.test(value)) {
          errors.push(`Field '${fieldName}' must be a valid UUID`);
          continue;
        }
        sanitizedData[fieldName] = value;
        break;

      case 'enum':
        if (!fieldSchema.values?.includes(value)) {
          errors.push(`Field '${fieldName}' must be one of: ${fieldSchema.values?.join(', ')}`);
          continue;
        }
        sanitizedData[fieldName] = value;
        break;

      case 'object':
        if (typeof value !== 'object' || value === null) {
          errors.push(`Field '${fieldName}' must be an object`);
          continue;
        }
        const jsonString = JSON.stringify(value);
        if (fieldSchema.maxSize && jsonString.length > fieldSchema.maxSize) {
          errors.push(`Field '${fieldName}' exceeds maximum size of ${fieldSchema.maxSize} bytes`);
          continue;
        }
        // Deep clone to prevent mutation
        sanitizedData[fieldName] = JSON.parse(jsonString);
        break;

      default:
        errors.push(`Unknown field type for '${fieldName}'`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : null
  };
};

/**
 * Rate limiting middleware
 */
export const checkRateLimit = (identifier: string, maxRequests = 30, windowMs = 60000): boolean => {
  return apiRateLimiter.isAllowed(identifier);
};

/**
 * Request size validation
 */
export const validateRequestSize = (request: any, maxSizeBytes: number = 1048576): boolean => {
  const size = new TextEncoder().encode(JSON.stringify(request)).length;
  return size <= maxSizeBytes;
};

/**
 * Sanitize response data before sending to client
 */
export const sanitizeResponseData = (data: any): any => {
  if (typeof data === 'string') {
    return sanitizeHTML(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponseData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeResponseData(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Create a secure API wrapper for Supabase operations
 */
export const createSecureApiWrapper = (operation: Function, schemaName: keyof typeof API_VALIDATION_SCHEMAS) => {
  return async (data: any, userId?: string) => {
    // Rate limiting
    const rateLimitKey = userId || 'anonymous';
    if (!checkRateLimit(rateLimitKey)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Request size validation
    if (!validateRequestSize(data)) {
      throw new Error('Request size exceeds maximum allowed size');
    }

    // Data validation
    const validation = validateRequestData(data, schemaName);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Execute operation with sanitized data
    try {
      const result = await operation(validation.sanitizedData);
      return sanitizeResponseData(result);
    } catch (error) {
      // Log security events
      console.error(`SECURITY: API operation failed for ${schemaName}`, {
        userId,
        timestamp: new Date().toISOString(),
        error: error.message
      });
      throw error;
    }
  };
};

// Export validation functions for use in API endpoints
export const apiValidation = {
  validateRequestData,
  checkRateLimit,
  validateRequestSize,
  sanitizeResponseData,
  createSecureApiWrapper
};