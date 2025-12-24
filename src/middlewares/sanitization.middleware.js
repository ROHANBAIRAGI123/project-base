import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

/**
 * Advanced input sanitization middleware with multiple layers
 */
export class InputSanitizer {
  /**
   * Remove potentially dangerous characters and patterns
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      // Remove null bytes
      .replace(/\x00/g, '')
      // Remove control characters except tabs and newlines
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Remove Unicode control characters
      .replace(/[\u0080-\u009F]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove potentially dangerous HTML/XML patterns
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Remove SQL injection patterns (basic)
      .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi, '')
      // Remove JavaScript injection patterns
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Sanitize email addresses
   */
  static sanitizeEmail(email) {
    if (typeof email !== 'string') return email;
    
    return email
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '') // Remove all spaces
      .replace(/[^\w@.-]/g, ''); // Keep only valid email characters
  }

  /**
   * Sanitize usernames
   */
  static sanitizeUsername(username) {
    if (typeof username !== 'string') return username;
    
    return username
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '') // Only allow alphanumeric, underscore, hyphen
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/-{2,}/g, '-'); // Replace multiple hyphens with single
  }

  /**
   * Sanitize names (allowing letters, spaces, hyphens, apostrophes)
   */
  static sanitizeName(name) {
    if (typeof name !== 'string') return name;
    
    return name
      .trim()
      .replace(/[^a-zA-Z\s'-]/g, '') // Only letters, spaces, hyphens, apostrophes
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/-+/g, '-') // Normalize hyphens
      .replace(/'+/g, "'"); // Normalize apostrophes
  }

  /**
   * Deep sanitization for objects and arrays
   */
  static deepSanitize(obj, customSanitizers = {}) {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item, customSanitizers));
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        // Apply custom sanitizer if available
        if (customSanitizers[key]) {
          sanitized[key] = customSanitizers[key](value);
        } else if (key === 'email') {
          sanitized[key] = this.sanitizeEmail(value);
        } else if (key === 'username') {
          sanitized[key] = this.sanitizeUsername(value);
        } else if (key.includes('name') || key.includes('Name')) {
          sanitized[key] = this.sanitizeName(value);
        } else {
          sanitized[key] = this.deepSanitize(value, customSanitizers);
        }
      }
      return sanitized;
    }
    
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    return obj;
  }
}

/**
 * Rate limiting and abuse prevention middleware
 */
export const rateLimitingValidation = asyncHandler(async (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';
  
  // Validate IP address format
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (clientIp && !ipRegex.test(clientIp) && !ipv6Regex.test(clientIp) && !clientIp.includes('::')) {
    throw new ApiError(400, 'Invalid client IP address');
  }
  
  // Check for suspicious user agents
  const suspiciousPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i,
    /scanner/i, /test/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious && process.env.NODE_ENV === 'production') {
    // Log suspicious activity
    console.warn(`Suspicious user agent detected: ${userAgent} from IP: ${clientIp}`);
  }
  
  req.clientInfo = {
    ip: clientIp,
    userAgent,
    isSuspicious
  };
  
  next();
});

/**
 * Content type validation middleware
 */
export const validateContentType = (allowedTypes = ['application/json']) => {
  return asyncHandler(async (req, res, next) => {
    const contentType = req.get('Content-Type');
    
    // Skip validation for GET requests
    if (req.method === 'GET') {
      return next();
    }
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      throw new ApiError(
        415,
        `Unsupported content type. Allowed types: ${allowedTypes.join(', ')}`
      );
    }
    
    next();
  });
};

/**
 * Request size validation middleware
 */
export const validateRequestSize = (maxSize = 1024 * 1024) => { // 1MB default
  return asyncHandler(async (req, res, next) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new ApiError(413, `Request size exceeds maximum allowed size of ${maxSize} bytes`);
    }
    
    next();
  });
};

/**
 * XSS protection middleware
 */
export const xssProtection = asyncHandler(async (req, res, next) => {
  // XSS patterns to check for
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*src[^>]*onerror/gi,
    /<svg[^>]*onload/gi,
  ];
  
  const checkXSS = (obj) => {
    if (typeof obj === 'string') {
      return xssPatterns.some(pattern => pattern.test(obj));
    }
    
    if (Array.isArray(obj)) {
      return obj.some(checkXSS);
    }
    
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkXSS);
    }
    
    return false;
  };
  
  if (checkXSS(req.body) || checkXSS(req.query)) {
    throw new ApiError(400, 'Potential XSS attack detected');
  }
  
  next();
});

/**
 * SQL injection protection middleware
 */
export const sqlInjectionProtection = asyncHandler(async (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\b.*=.*)/gi,
    /(--|\/\*|\*\/)/g,
    /(\bUNION\b.*\bSELECT\b)/gi,
  ];
  
  const checkSQL = (obj) => {
    if (typeof obj === 'string') {
      return sqlPatterns.some(pattern => pattern.test(obj));
    }
    
    if (Array.isArray(obj)) {
      return obj.some(checkSQL);
    }
    
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkSQL);
    }
    
    return false;
  };
  
  if (checkSQL(req.body) || checkSQL(req.query)) {
    throw new ApiError(400, 'Potential SQL injection detected');
  }
  
  next();
});

/**
 * Comprehensive input sanitization middleware
 */
export const sanitizeAndValidateInput = (config = {}) => {
  const {
    enableXSSProtection = true,
    enableSQLProtection = true,
    customSanitizers = {},
    maxRequestSize = 1024 * 1024, // 1MB
    allowedContentTypes = ['application/json', 'multipart/form-data']
  } = config;

  const middlewares = [];

  // Add request size validation
  middlewares.push(validateRequestSize(maxRequestSize));

  // Add content type validation
  middlewares.push(validateContentType(allowedContentTypes));

  // Add security protections
  if (enableXSSProtection) {
    middlewares.push(xssProtection);
  }

  if (enableSQLProtection) {
    middlewares.push(sqlInjectionProtection);
  }

  // Add rate limiting validation
  middlewares.push(rateLimitingValidation);

  // Add deep sanitization
  middlewares.push(asyncHandler(async (req, res, next) => {
    if (req.body) {
      req.body = InputSanitizer.deepSanitize(req.body, customSanitizers);
    }
    
    if (req.query) {
      req.query = InputSanitizer.deepSanitize(req.query, customSanitizers);
    }
    
    next();
  }));

  return middlewares;
};