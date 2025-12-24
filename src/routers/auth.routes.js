import { Router } from "express";
import { registerUser } from "../controllers/auth.controllers.js";
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

// Register user route with comprehensive validation
router.route("/register").post(
  // Apply comprehensive sanitization and validation layers
  ...createValidationLayer({
    schema: userRegisterSchema,
    sanitize: true,
    validateSecurity: true,
    responseSchema: process.env.NODE_ENV === 'development' ? userRegisterResponseSchema : null
  }),
  registerUser
);

// Login user route with validation
router.route("/login").post(
  ...createValidationLayer({
    schema: userLoginSchema,
    sanitize: true,
    validateSecurity: true,
    responseSchema: process.env.NODE_ENV === 'development' ? userLoginResponseSchema : null
  }),
  // loginUser - controller needs to be implemented
);

// Change password route with enhanced security validation
router.route("/change-password").patch(
  // Apply maximum security for password changes
  ...sanitizeAndValidateInput({
    enableXSSProtection: true,
    enableSQLProtection: true,
    maxRequestSize: 1024 * 512, // 512KB - smaller limit for password changes
  }),
  validate(userChangeCurrentPasswordSchema),
  // Authentication middleware would go here
  // changePassword - controller needs to be implemented
);

// Forgot password route with rate limiting considerations
router.route("/forgot-password").post(
  ...createValidationLayer({
    schema: userForgotPasswordSchema,
    sanitize: true,
    validateSecurity: false // Public endpoint
  }),
  // forgotPassword - controller needs to be implemented
);

// Reset password route with token validation
router.route("/reset-password/:resetToken").post(
  ...createValidationLayer({
    schema: userResetForgotPasswordSchema,
    sanitize: true
  }),
  // resetPassword - controller needs to be implemented
);

// Email verification route with minimal validation (public endpoint)
router.route("/verify-email/:verificationToken").get(
  validate(userEmailVerificationSchema),
  // verifyEmail - controller needs to be implemented
);

// Refresh token route
router.route("/refresh-token").post(
  // No body validation needed, token comes from cookies/headers
  // refreshToken - controller needs to be implemented
);

// Logout route
router.route("/logout").post(
  // Authentication middleware would go here
  // logout - controller needs to be implemented
);

// Get current user profile
router.route("/me").get(
  // Authentication middleware would go here
  // getCurrentUser - controller needs to be implemented
);

// Update user profile
router.route("/me").patch(
  // Authentication middleware would go here
  ...createValidationLayer({
    schema: userProfileUpdateSchema,
    sanitize: true,
    validateSecurity: true
  }),
  // updateUserProfile - controller needs to be implemented
);

// Resend email verification
router.route("/resend-email-verification").post(
  // Authentication middleware would go here
  // resendEmailVerification - controller needs to be implemented
);

export default router;