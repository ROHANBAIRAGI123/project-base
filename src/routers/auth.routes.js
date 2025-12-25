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

router.route("/get-all-users").get(getAllUsers);

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
