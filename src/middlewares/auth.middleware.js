import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// JWT verification middleware - extracts token from cookies or Authorization header
const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];
    
    if (!token) {
      throw new ApiError(401, "Authentication token is missing");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select(
      "-password -resetToken -resetTokenExpiry -verificationToken -verificationTokenExpiry"
    );
    
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token");
  }
});

export { verifyJWT };

/*
 * ===========================================================================================
 *                              NOTES — auth.middleware.js
 * ===========================================================================================
 *
 * PURPOSE: Secures protected routes by verifying the presence and validity of a JWT access token.
 * ROLE IN ARCHITECTURE: Security layer. Acts as a gatekeeper, ensuring only authenticated users can access the system.
 * 
 * IMPORTS:
 * - `ApiError`, `asyncHandler`: Standard error handling utilities.
 * - `jsonwebtoken`: Used to cryptographically verify the token signature.
 * - `User` model: Used to fetch the user's data from the database.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `verifyJWT(req, res, next)`: Middleware function.
 *   - What it does: Extracts the token from cookies or the `Authorization: Bearer` header. Verifies it using the secret. Finds the user in the database (excluding sensitive fields). Attaches the user object to the request (`req.user = user`).
 *   - Parameters: Express req, res, next.
 *   - Returns: Calls `next()` if successful.
 *   - Side effects: Modifies the `req` object.
 *   - Edge cases: Throws a 401 ApiError if the token is missing, malformed, expired, or if the user was deleted after the token was issued.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Imported by route definitions (`task.routes.js`, `project.routes.js`) and applied to specific endpoints.
 * - Outbound dependencies: Interacts directly with the `User` DB model.
 * 
 * DESIGN PATTERNS:
 * - Middleware Pattern: Intercepts the request lifecycle before it reaches the controller.
 * - Token-Based Authentication: Stateless verification using JWTs instead of server-side sessions.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why check both cookies and the Authorization header?
 *    Answer: It provides flexibility. Web browsers can use HTTP-only cookies (more secure against XSS), while mobile apps or external API consumers can use the `Authorization: Bearer <token>` header.
 * 2. Why fetch the user from the database instead of just relying on the token payload?
 *    Answer: While decoding the token proves it was issued by the server, fetching the user ensures they haven't been deleted or banned since the token was issued.
 * 3. What does `.select("-password -resetToken...")` do?
 *    Answer: It projects the Mongoose query to exclude those sensitive fields, ensuring they are never accidentally exposed via the `req.user` object in downstream controllers.
 */
