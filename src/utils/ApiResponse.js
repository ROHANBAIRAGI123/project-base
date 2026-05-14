class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };

/*
 * ===========================================================================================
 *                              NOTES — ApiResponse.js
 * ===========================================================================================
 *
 * PURPOSE: Standardizes the structure of successful HTTP responses sent to the client.
 * ROLE IN ARCHITECTURE: Presentation layer utility used by all controllers to ensure a consistent API contract.
 * 
 * IMPORTS:
 * - None
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - constructor(statusCode, data, message): Initializes the response format.
 *   - Parameters: `statusCode` (number, HTTP status), `data` (any payload), `message` (string, default "Success").
 *   - Returns: Instance with `statusCode`, `data`, `message`, and a computed `success` boolean.
 *   - Side effects: None.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Used by all controllers (auth, task, project, note) to wrap output data before calling `res.status().json()`.
 * - Outbound dependencies: None.
 * 
 * DESIGN PATTERNS:
 * - Data Transfer Object (DTO) pattern: Normalizes the shape of data returned by the API.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why use a class for standardizing responses instead of a plain object?
 *    Answer: A class guarantees that every response follows the exact same schema, preventing developers from accidentally omitting fields like `success` or `message`.
 * 2. How is the `success` property calculated?
 *    Answer: It evaluates whether the `statusCode` is less than 400. HTTP 2xx and 3xx codes represent success, while 4xx and 5xx represent errors.
 * 3. What are the benefits of a uniform API response structure?
 *    Answer: It drastically simplifies frontend state management and error handling, as the client can confidently predict the shape of the data.
 */
