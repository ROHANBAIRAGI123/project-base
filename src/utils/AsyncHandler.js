const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    try {
      return Promise.resolve(requestHandler(req, res, next)).catch((err) =>
        next(err),
      );
    } catch (err) {
      next(err); // for synchronous errors like throw
    }
  };
};

export { asyncHandler };

/*
 * ===========================================================================================
 *                              NOTES — AsyncHandler.js
 * ===========================================================================================
 *
 * PURPOSE: Wrapper function to automatically catch unhandled promise rejections in Express routes.
 * ROLE IN ARCHITECTURE: Controller wrapper layer. Eliminates the need for repetitive try/catch blocks in every async route handler.
 *
 * IMPORTS:
 * - None
 *
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - asyncHandler(requestHandler): Wraps an async route handler.
 *   - Parameters: `requestHandler` (the original Express middleware/controller function).
 *   - Returns: A new middleware function `(req, res, next)`.
 *   - Side effects: Intercepts any thrown errors or rejected promises and forwards them to Express's `next()` function, triggering the global error handler.
 *
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Used by all controller files (`task.controllers.js`, `auth.controllers.js`, etc.) to wrap exported handler functions.
 * - Outbound dependencies: None.
 *
 * DESIGN PATTERNS:
 * - Higher-Order Function / Decorator Pattern: Takes a function and returns a modified version of it, adding automatic error catching behavior.
 *
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why is this wrapper necessary in Express?
 *    Answer: Older versions of Express (pre-5.0) do not natively catch rejected promises in async routes. Without this or a try/catch, unhandled rejections would crash the Node process.
 * 2. Explain `Promise.resolve().catch(err => next(err))`.
 *    Answer: `Promise.resolve()` forces the result of `requestHandler` into a promise (in case it wasn't async), and `.catch()` safely catches any errors and passes them to the next middleware (error handler).
 * 3. What would happen if we just exported the raw async controllers?
 *    Answer: Every controller would need an explicit `try { ... } catch (err) { next(err) }` block, leading to massive boilerplate across the application.
 */
