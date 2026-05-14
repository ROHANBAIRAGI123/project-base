import { Router } from "express";
import { 
    loginUser,
    registerUser, 
    logoutUser,
    deleteUser,
    getAllUsers,
    getCurrentUser,
    verifyEmailToken,
    sendVerificationEmail,
    refreshAccessToken,
    changePassword,
    forgotPassword,
    resetPassword,
    updateUserProfile
} from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate, createValidationLayer } from "../middlewares/validation.middleware.js";
import { sanitizeAndValidateInput } from "../middlewares/sanitization.middleware.js";
import {
    userRegisterSchema,
    userLoginSchema,
    userChangeCurrentPasswordSchema,
    userForgotPasswordSchema,
    userResetForgotPasswordSchema,
    userEmailVerificationSchema,
    userProfileUpdateSchema
} from "../validators/index.js";
import {
    userRegisterResponseSchema,
    userLoginResponseSchema,
    successResponseSchema
} from "../validators/response.schemas.js";

const router = Router();

// Public routes
router.route("/register").post(
    ...createValidationLayer({
        schema: userRegisterSchema,
        sanitize: true,
        validateSecurity: true,
        responseSchema: process.env.NODE_ENV === 'development' ? userRegisterResponseSchema : null
    }),
    registerUser
);

router.route("/login").post(
    ...createValidationLayer({
        schema: userLoginSchema,
        sanitize: true,
        validateSecurity: true,
        responseSchema: process.env.NODE_ENV === 'development' ? userLoginResponseSchema : null
    }),
    loginUser
);

router.route("/verify-email/:verificationToken").get(
    validate(userEmailVerificationSchema),
    verifyEmailToken
);

router.route("/refresh-access-token").post(refreshAccessToken);

router.route("/forgot-password").post(
    ...createValidationLayer({
        schema: userForgotPasswordSchema,
        sanitize: true,
        validateSecurity: false
    }),
    forgotPassword
);

router.route("/reset-password/:resetToken").post(
    ...createValidationLayer({
        schema: userResetForgotPasswordSchema,
        sanitize: true
    }),
    resetPassword
);

router.route("/get-all-users").get(verifyJWT,getAllUsers);

// Protected routes (require authentication)
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/delete-user").post(verifyJWT, deleteUser);

router.route("/me").get(verifyJWT, getCurrentUser);

router.route("/send-verification-email").post(verifyJWT, sendVerificationEmail);

router.route("/change-password").patch(
    verifyJWT,
    ...sanitizeAndValidateInput({
        enableXSSProtection: true,
        enableSQLProtection: true,
        maxRequestSize: 1024 * 512,
    }),
    validate(userChangeCurrentPasswordSchema),
    changePassword
);

router.route("/me").patch(
    verifyJWT,
    ...createValidationLayer({
        schema: userProfileUpdateSchema,
        sanitize: true,
        validateSecurity: true
    }),
    updateUserProfile
);

export default router;

/*
 * ===========================================================================================
 *                              NOTES — auth.routes.js
 * ===========================================================================================
 *
 * PURPOSE: Maps authentication and user profile related HTTP requests to their respective controller functions.
 * ROLE IN ARCHITECTURE: Routing layer. Directs traffic entering via `/api/v1/auth` through appropriate validation and security middlewares before hitting the controller logic.
 * 
 * IMPORTS:
 * - `express.Router`: Used to create modular, mountable route handlers.
 * - Controller functions (`loginUser`, `registerUser`, etc.): The actual business logic handlers.
 * - Middlewares (`verifyJWT`, `validate`, `createValidationLayer`, `sanitizeAndValidateInput`): Used to enforce security, authentication, and input schema validation.
 * - Validation Schemas (`userRegisterSchema`, etc.): Zod definitions defining what data is allowed.
 * - Response Schemas (`userLoginResponseSchema`, etc.): Zod definitions defining output shape.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - Public Routes (`/register`, `/login`, `/verify-email`, `/forgot-password`, `/reset-password`):
 *   - Wrapped in heavy validation and sanitization layers (XSS, SQL injection protection).
 *   - No `verifyJWT` needed as these are for unauthenticated users.
 * - Protected Routes (`/logout`, `/me`, `/change-password`, `/delete-user`):
 *   - All require the `verifyJWT` middleware.
 *   - `req.user` is guaranteed to be populated by the time the controller is reached.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Mounted in `src/app.js` under the prefix `/api/v1/auth`.
 * - Outbound dependencies: Passes flow control to `auth.controllers.js`.
 * 
 * DESIGN PATTERNS:
 * - Router-Level Middleware Pattern: Validation and security are applied per-route at the router level, keeping controllers strictly focused on business logic rather than request parsing.
 * - Environmental Toggles: Response validation (`responseSchema`) is only applied in development mode (`process.env.NODE_ENV === 'development'`) to avoid production performance overhead.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why is `verifyJWT` required on `/logout`?
 *    Answer: Because logging out involves invalidating the specific user's refresh token and clearing their cookies. The server needs to know *who* is making the logout request to clear the correct database records.
 * 2. Why use `patch` instead of `put` for `/change-password`?
 *    Answer: `PUT` implies replacing the entire resource (the whole user object), whereas `PATCH` implies applying partial modifications (just the password field).
 * 3. What does `createValidationLayer` do here?
 *    Answer: It dynamically generates an array of middleware functions (sanitization, schema validation, security header checks) which Express spreads `...` into the route definition, ensuring robust defense-in-depth before the controller runs.
 */
