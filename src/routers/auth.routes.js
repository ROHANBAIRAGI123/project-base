import { Router } from "express";
import { 
        loginUser,
        registerUser, 
        logoutUser,
        deleteUser,
        getAllUsers,
        getUserById 
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
  loginUser
);

// Logout route
router.route("/logout").post(verifyJWT, logoutUser);

// delete user route
router.route("/delete-user").post(verifyJWT, deleteUser);

// get all users route
router.route("/get-all-users").get(getAllUsers);

// get user by id route
router.route("/get-user/:id").get(getUserById);

// TODO: Uncomment these routes once controllers are implemented

// // Change password route with enhanced security validation
// router.route("/change-password").patch(
//   ...sanitizeAndValidateInput({
//     enableXSSProtection: true,
//     enableSQLProtection: true,
//     maxRequestSize: 1024 * 512,
//   }),
//   validate(userChangeCurrentPasswordSchema),
//   changePassword
// );

// // Forgot password route
// router.route("/forgot-password").post(
//   ...createValidationLayer({
//     schema: userForgotPasswordSchema,
//     sanitize: true,
//     validateSecurity: false
//   }),
//   forgotPassword
// );

// // Reset password route
// router.route("/reset-password/:resetToken").post(
//   ...createValidationLayer({
//     schema: userResetForgotPasswordSchema,
//     sanitize: true
//   }),
//   resetPassword
// );

// // Email verification route
// router.route("/verify-email/:verificationToken").get(
//   validate(userEmailVerificationSchema),
//   verifyEmail
// );

// // Refresh token route
// router.route("/refresh-token").post(refreshToken);


// // Get current user profile
// router.route("/me").get(getCurrentUser);

// // Update user profile
// router.route("/me").patch(
//   ...createValidationLayer({
//     schema: userProfileUpdateSchema,
//     sanitize: true,
//     validateSecurity: true
//   }),
//   updateUserProfile
// );

export default router;