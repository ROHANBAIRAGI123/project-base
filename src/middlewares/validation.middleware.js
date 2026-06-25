import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

/**
 * Validation middleware that validates request data against Zod schemas
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export const validate = (schema) => {
  return asyncHandler(async (req, res, next) => {
    try {
      // Extract validation targets
      const dataToValidate = {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
      };

      // Parse and validate the data
      const validatedData = await schema.parseAsync(dataToValidate);

      // Transform and sanitize the validated data back to request object
      // Note: In Express 5, req.query and req.params are read-only, so we only update req.body
      if (validatedData.body) {
        req.body = validatedData.body;
      }

      // Store validated query/params in a custom property for access if needed
      req.validatedData = validatedData;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodErrors = error.errors || error.issues || [];
        const formattedErrors = zodErrors.map((err) => ({
          field: err.path?.join(".") || "unknown",
          message: err.message,
          value: err.input,
        }));
        console.log(req.body);

        throw new ApiError(
          400,
          "Validation failed",
          formattedErrors.length > 0
            ? formattedErrors
            : [{ message: error.message }],
        );
      }

      // Re-throw other errors
      throw error;
    }
  });
};

/**
 * Middleware to sanitize and transform common input fields
 */
export const sanitizeInput = asyncHandler(async (req, res, next) => {
  // Deep sanitization function
  const sanitizeValue = (value) => {
    if (typeof value === "string") {
      return value
        .trim()
        .replace(/[\x00-\x1f\x7f-\x9f]/g, "") // Remove control characters
        .replace(/\s+/g, " "); // Normalize whitespace
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value && typeof value === "object") {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  // Sanitize request data
  // Note: In Express 5, req.query is read-only, so we only sanitize req.body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  // req.query is read-only in Express 5, skip sanitization
  // Query params should be validated via Zod schemas instead

  next();
});

/**
 * Response validation middleware
 * @param {z.ZodSchema} schema - Zod schema to validate response data
 * @returns {Function} Express middleware function
 */
export const validateResponse = (schema) => {
  return (req, res, next) => {
    // Override the json method to validate response data
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      try {
        const validatedData = schema.parse(data);
        return originalJson(validatedData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Response validation failed:", error.errors);
          // Log but don't break the response in production
          if (process.env.NODE_ENV === "development") {
            return originalJson({
              error: "Response validation failed",
              validationErrors: error.errors,
              originalData: data,
            });
          }
        }
        return originalJson(data);
      }
    };

    next();
  };
};

/**
 * Rate limiting validation schema
 */
export const rateLimitSchema = z.object({
  headers: z
    .object({
      "x-forwarded-for": z.string().optional(),
      "user-agent": z.string().optional(),
    })
    .passthrough(),
});

/**
 * File upload validation middleware
 * @param {Object} options - Upload validation options
 * @param {string[]} options.allowedTypes - Allowed MIME types
 * @param {number} options.maxSize - Maximum file size in bytes
 * @param {number} options.maxFiles - Maximum number of files
 * @returns {Function} Express middleware function
 */
export const validateFileUpload = (options = {}) => {
  const {
    allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"],
    maxSize = 5 * 1024 * 1024, // 5MB
    maxFiles = 5,
  } = options;

  return asyncHandler(async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    const files = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();

    if (files.length > maxFiles) {
      throw new ApiError(400, `Maximum ${maxFiles} files allowed`);
    }

    for (const file of files) {
      // Validate file type
      if (!allowedTypes.includes(file.mimetype)) {
        throw new ApiError(
          400,
          `File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(", ")}`,
        );
      }

      // Validate file size
      if (file.size > maxSize) {
        throw new ApiError(
          400,
          `File size ${file.size} exceeds maximum allowed size of ${maxSize} bytes`,
        );
      }

      // Additional security checks
      if (
        file.name.includes("..") ||
        file.name.includes("/") ||
        file.name.includes("\\")
      ) {
        throw new ApiError(400, "Invalid file name");
      }
    }

    next();
  });
};

/**
 * Security headers validation middleware
 */
export const validateSecurityHeaders = asyncHandler(async (req, res, next) => {
  // Check for common security headers and validate them
  const securityHeaderSchema = z
    .object({
      "content-type": z.string().optional(),
      authorization: z.string().optional(),
      "x-api-key": z.string().optional(),
      origin: z.string().url().optional(),
      referer: z.string().url().optional(),
    })
    .passthrough();

  try {
    securityHeaderSchema.parse(req.headers);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError(400, "Invalid security headers", error.errors);
    }
    throw error;
  }
});

/**
 * Advanced validation wrapper that combines multiple validation layers
 * @param {Object} validationConfig - Configuration object
 * @param {z.ZodSchema} validationConfig.schema - Main validation schema
 * @param {z.ZodSchema} validationConfig.responseSchema - Optional response validation schema
 * @param {boolean} validationConfig.sanitize - Whether to apply input sanitization
 * @param {boolean} validationConfig.validateSecurity - Whether to validate security headers
 * @returns {Array} Array of middleware functions
 */
export const createValidationLayer = (validationConfig = {}) => {
  const {
    schema,
    responseSchema,
    sanitize = true,
    validateSecurity = false,
  } = validationConfig;

  const middlewares = [];

  // Add security validation if requested
  if (validateSecurity) {
    middlewares.push(validateSecurityHeaders);
  }

  // Add input sanitization if requested
  if (sanitize) {
    middlewares.push(sanitizeInput);
  }

  // Add main validation if schema provided
  if (schema) {
    middlewares.push(validate(schema));
  }

  // Add response validation if schema provided
  if (responseSchema) {
    middlewares.push(validateResponse(responseSchema));
  }

  return middlewares;
};

/*
 * ===========================================================================================
 *                              NOTES — validation.middleware.js
 * ===========================================================================================
 *
 * PURPOSE: Executes Zod validation schemas against incoming requests and handles validation errors.
 * ROLE IN ARCHITECTURE: Controller wrapper. Ensures the controller only ever receives clean, strongly-typed, and guaranteed-valid data.
 *
 * IMPORTS:
 * - `z` (Zod): For `instanceof` error checking.
 * - `ApiError`, `asyncHandler`: For standardized error handling.
 *
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `validate(schema)`: Intercepts the request. Parses `req.body`, `req.query`, `req.params` against the provided Zod schema. If it fails, formats the Zod issues into an array and throws a 400 ApiError. If it succeeds, replaces `req.body` with the parsed (and potentially type-casted/transformed) data.
 * - `sanitizeInput`: Trims and strips control characters from the body.
 * - `validateResponse(schema)`: Overrides `res.json` to intercept outbound data, validating it against a response schema to prevent accidental sensitive data leakage.
 * - `validateFileUpload(options)`: Checks `req.files` against allowed MIME types, max sizes, and count limits before allowing the upload to proceed.
 * - `createValidationLayer(config)`: Combines input sanitization, security header checks, schema validation, and response validation into a single middleware chain.
 *
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Heavily used in all route files (`*.routes.js`) to apply the schemas defined in `validators/index.js`.
 * - Outbound dependencies: Depends on Zod schemas passed as arguments.
 *
 * DESIGN PATTERNS:
 * - Decorator/Monkey Patching Pattern: `validateResponse` temporarily overrides the native `res.json` function to inject validation logic before calling the original function.
 *
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why reassign `req.body = validatedData.body` after validation?
 *    Answer: Zod doesn't just validate; it also transforms data (e.g., casting strings to numbers, trimming strings, applying defaults). Reassigning ensures downstream controllers get the cleaned data, not the raw input.
 * 2. Why does `validateResponse` only log errors in development but still send the data?
 *    Answer: Response validation is a safety net. If a developer breaks the contract, we want to know immediately in dev. In production, we'd rather serve a slightly malformed response to the user than crash the request entirely with a 500 error.
 * 3. How does `validateFileUpload` work if it doesn't parse the files itself?
 *    Answer: It assumes a multipart parser middleware (like Multer) has already run and populated `req.files`. It simply enforces business rules (size, type) on the already-parsed file metadata.
 */
