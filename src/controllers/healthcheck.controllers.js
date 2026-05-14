import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

/**
const healthCheck = async (req, res, next) => {
  try {
    const user = await getUserFromDB()
    res
      .status(200)
      .json(new ApiResponse(200, { message: "Server is running" }));
  } catch (error) {
    next(err)
  }
};
 */

const healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { message: "Server is running" }));
});

export { healthCheck };

/*
 * ===========================================================================================
 *                              NOTES — healthcheck.controllers.js
 * ===========================================================================================
 *
 * PURPOSE: Extremely lightweight controller to verify the API server is responsive.
 * ROLE IN ARCHITECTURE: Controller layer. Used for infrastructure monitoring.
 * 
 * IMPORTS:
 * - `ApiResponse`, `asyncHandler`: Standardized utilities.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `healthCheck`: Immediately returns a 200 OK status with a generic success message.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: `healthcheck.routes.js`.
 * - Outbound dependencies: None currently.
 * 
 * DESIGN PATTERNS:
 * - Liveness Probe: It only checks if the Express process is running.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. What is the difference between a Liveness probe and a Readiness probe?
 *    Answer: This is currently a Liveness probe (is the process alive?). A Readiness probe would also verify that critical dependencies (like the database connection) are active before returning 200 OK (as seen in the commented-out code `getUserFromDB()`).
 */
