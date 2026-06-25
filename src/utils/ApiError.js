class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };

/*
 * ===========================================================================================
 *                              NOTES — ApiError.js
 * ===========================================================================================
 *
 * PURPOSE: Standardizes custom error definitions for operational errors in the application.
 * ROLE IN ARCHITECTURE: Error handling layer. Used throughout the application to throw predictable errors that are caught and formatted by the global error handler.
 *
 * IMPORTS:
 * - None
 *
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - constructor(statusCode, message, errors, stack): Enhances the native Error class with API-specific properties.
 *   - Parameters: `statusCode` (HTTP error code), `message` (string), `errors` (array of validation errors), `stack` (stack trace).
 *   - Returns: Enhanced Error instance.
 *   - Side effects: Captures the stack trace if not provided.
 *
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Used by controllers, validation middlewares, and services to throw structured exceptions.
 * - Outbound dependencies: Inherits from the native JavaScript `Error` class.
 *
 * DESIGN PATTERNS:
 * - Custom Exception Pattern: Extends base language primitives to add domain-specific context (HTTP status codes, field-level errors).
 *
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why extend the built-in Error class?
 *    Answer: It allows `instanceof ApiError` checks in the global error middleware, ensuring these operational errors are handled differently from unexpected crashes.
 * 2. What is the purpose of `Error.captureStackTrace`?
 *    Answer: It creates a `.stack` property on the error instance, pointing to the exact line where the error was thrown, excluding the constructor itself to keep the stack clean.
 * 3. How does this class support validation errors?
 *    Answer: Through the `errors` array property, which allows returning multiple field-level validation issues (like those from Zod) in a single response.
 */
