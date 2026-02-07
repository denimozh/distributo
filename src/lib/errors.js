/**
 * API Error Handling Utilities
 * Consistent error handling across the application
 */

// ==========================================
// ERROR TYPES
// ==========================================

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error. Please check your connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends Error {
  constructor(message = 'Authentication required. Please log in.') {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

// ==========================================
// ERROR MESSAGE MAPPING
// ==========================================

const ERROR_MESSAGES = {
  // HTTP Status Codes
  400: 'Invalid request. Please check your input.',
  401: 'Session expired. Please log in again.',
  403: 'You don\'t have permission for this action.',
  404: 'Resource not found.',
  409: 'Conflict. This resource may already exist.',
  422: 'Invalid data. Please check your input.',
  429: 'Too many requests. Please wait a moment.',
  500: 'Server error. Please try again later.',
  502: 'Service temporarily unavailable.',
  503: 'Service temporarily unavailable.',
  504: 'Request timed out. Please try again.',

  // Custom Error Codes
  'NETWORK_ERROR': 'Network error. Please check your connection.',
  'TIMEOUT': 'Request timed out. Please try again.',
  'INVALID_TOKEN': 'Session expired. Please log in again.',
  'RATE_LIMITED': 'Too many requests. Please wait a moment.',
  'QUOTA_EXCEEDED': 'Usage limit reached. Please upgrade your plan.',
  'INTEGRATION_ERROR': 'Integration error. Please reconnect your account.',
};

// ==========================================
// FETCH WRAPPER WITH ERROR HANDLING
// ==========================================

/**
 * Enhanced fetch wrapper with automatic error handling
 */
export async function apiFetch(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle error responses
    if (!response.ok) {
      const errorMessage = data?.error || data?.message || ERROR_MESSAGES[response.status] || 'An error occurred';
      throw new ApiError(errorMessage, response.status, data?.code);
    }

    return data;
  } catch (error) {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new NetworkError();
    }
    
    // Timeout errors
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out', 504, 'TIMEOUT');
    }

    // Re-throw API errors
    if (error instanceof ApiError) {
      throw error;
    }

    // Unknown errors
    throw new ApiError(error.message || 'An unexpected error occurred', 500);
  }
}

// ==========================================
// ERROR FORMATTING
// ==========================================

/**
 * Format any error into a user-friendly message
 */
export function formatError(error) {
  if (!error) return 'An unexpected error occurred';

  // Already a string
  if (typeof error === 'string') return error;

  // API Error
  if (error instanceof ApiError) {
    return error.message;
  }

  // Network Error
  if (error instanceof NetworkError) {
    return error.message;
  }

  // Auth Error
  if (error instanceof AuthError) {
    return error.message;
  }

  // Validation Error
  if (error instanceof ValidationError) {
    const fieldErrors = Object.values(error.fields).filter(Boolean);
    return fieldErrors.length > 0 ? fieldErrors[0] : error.message;
  }

  // Supabase errors
  if (error?.code) {
    const supabaseMessages = {
      'PGRST116': 'Resource not found',
      '23505': 'This record already exists',
      '23503': 'Referenced resource not found',
      '42501': 'Permission denied',
      'invalid_grant': 'Session expired. Please log in again.',
    };
    if (supabaseMessages[error.code]) {
      return supabaseMessages[error.code];
    }
  }

  // Standard error object
  if (error.message) {
    // Clean up common technical messages
    let message = error.message;
    
    if (message.includes('Failed to fetch')) {
      return 'Network error. Please check your connection.';
    }
    if (message.includes('NetworkError')) {
      return 'Network error. Please check your connection.';
    }
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (message.includes('401')) {
      return 'Session expired. Please log in again.';
    }
    
    return message;
  }

  return 'An unexpected error occurred';
}

// ==========================================
// RETRY LOGIC
// ==========================================

/**
 * Retry a function with exponential backoff
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => {
      // Retry on network errors and 5xx errors
      if (error instanceof NetworkError) return true;
      if (error instanceof ApiError && error.status >= 500) return true;
      if (error instanceof ApiError && error.status === 429) return true;
      return false;
    },
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// ==========================================
// API RESPONSE HELPERS
// ==========================================

/**
 * Create a standardized success response
 */
export function successResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Create a standardized error response
 */
export function errorResponse(message, status = 500, code = null) {
  return {
    success: false,
    error: message,
    status,
    code,
  };
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validate required fields
 */
export function validateRequired(data, fields) {
  const errors = {};
  
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors[field] = `${field} is required`;
    }
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }
  
  return true;
}

/**
 * Validate URL format
 */
export function validateUrl(url, fieldName = 'URL') {
  if (!url) return true; // Optional
  
  try {
    new URL(url);
    return true;
  } catch {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
  return true;
}