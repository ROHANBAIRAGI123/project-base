import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import  User  from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { emailVerificationMailgenContent,sendEmail, forgotPasswordMailgenContent } from "../utils/mail.js";
import { options } from "../utils/constants.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

// Generate access and refresh tokens for a user
const generateAccessTokenAndRefreshToken = async (userid) => {
    try {
        const user = await User.findById(userid);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error generating tokens");
    }
}

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullname } = req.body;

    const existingUser = await User.findOne({ 
        $or: [{ username }, { email }]
     });
    if (existingUser) {
        throw new ApiError(400, "Username or email already in use");
    }

    const newUser = new User({
        username,
        email,
        password,
        fullname,
        isEmailVerified: false,
    });

    const temporaryToken = newUser.generateEmailVerificationToken();
    await newUser.save();
    
    // Send verification email
    const verificationLink = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${temporaryToken}`;
    await sendEmail({
        email: newUser.email,
        subject: "Email Verification",
        mailgenContent: emailVerificationMailgenContent(newUser.username, verificationLink)
    });

    const createdUser = await User.findById(newUser._id).select("-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry");

    if(!createdUser) {
        throw new ApiError(500, "Error creating user");
    }

    res.status(201).json(new ApiResponse(200, {user: createdUser}, "User registered successfully. Please verify your email."));
})

// Login user and return tokens
const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body;
    
    const user = await User.findOne({email});
    if(!user) {
        throw new ApiError(401, "Invalid email");
    }

    const isPasswordValid = await user.comparePassword(password);
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    if (!user.isEmailVerified) {
        throw new ApiError(403, "Email not verified. Please verify your email before logging in.");
    }

    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);
    
    const userData = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry");

    res.status(201)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200, {user: userData, accessToken, refreshToken}, "User logged in successfully."));
});

// Logout user and clear tokens
const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1, accessToken: 1, refreshTokenExpiry: 1, accessTokenExpiry: 1 } }, { new: true });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    await user.save({ validateBeforeSave: false });

    res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully."));
});

// Delete user account (requires password verification)
const deleteUser = asyncHandler(async (req, res) => {
    const {password} = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if(!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.comparePassword(password);
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    await User.findByIdAndDelete(user._id);

    res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User deleted successfully."));
});

// Get all users (should be admin protected)
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password -refreshToken -__v -_id -emailVerificationToken -emailVerificationTokenExpiry -createdAt -updatedAt -refreshTokenExpiry -forgotPasswordToken -forgotPasswordTokenExpiry -isEmailVerified -avatar");
    res.status(200).json(new ApiResponse(200, {users}, "Users fetched successfully."));
});

// Get current authenticated user
const getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select("-password -refreshToken -__v -emailVerificationToken -emailVerificationTokenExpiry -refreshTokenExpiry -forgotPasswordToken -forgotPasswordTokenExpiry");
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    res.status(200).json(new ApiResponse(200, { user }, "User fetched successfully."));
});

// Verify email using token from email link
const verifyEmailToken = asyncHandler(async (req, res) => {
    const {verificationToken} = req.params;

    if(!verificationToken) {
        throw new ApiError(400, "Verification token is required");
    }

    // Hash token to match stored hash
    const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
    
    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpiry: { $gt: Date.now() }
    });

    if(!user) {
        throw new ApiError(400, "Invalid or expired verification token");
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json(new ApiResponse(200, null, "Email verified successfully."));
}); 

// Resend verification email
const sendVerificationEmail = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    const temporaryToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verificationLink = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${temporaryToken}`;
    await sendEmail({
        email: user.email,
        subject: "Email Verification",
        mailgenContent: emailVerificationMailgenContent(user.username, verificationLink)
    });

    res.status(200).json(new ApiResponse(200, null, "Verification email sent successfully."));
});

// Refresh access token using refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.headers?.authorization?.split(" ")[1];
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is missing in refresh token cookie or Authorization header");
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    if(!decodedToken || !decodedToken._id) {
        throw new ApiError(401, "Invalid refresh token");
    }

    const user = await User.findById(decodedToken._id);
    if (!user) {    
        throw new ApiError(404, "User not found");
    }

    // Validate token matches stored value
    if ( user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Refresh token mismatch");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully."));
});

// Change password (requires current password)
const changePassword = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId );
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.comparePassword(oldPassword);
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid current password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json(new ApiResponse(200, null, "Password changed successfully."));
});

// Send password reset email
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
     }

    const token = crypto.randomBytes(20).toString("hex");
    
    // Store hashed token with 20 min expiry
    user.forgotPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.forgotPasswordTokenExpiry = Date.now() + 60 * 20 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetLink = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${token}`;

    await sendEmail({
        email: user.email,
        subject: "Password Reset",
        mailgenContent: forgotPasswordMailgenContent(user.username, resetLink)
    });

    res.status(200).json(new ApiResponse(200, null, "Password reset email sent successfully."));
});

// Reset password using token from email
const resetPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if(!resetToken) {
        throw new ApiError(400, "Reset token is required");
    }

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordTokenExpiry: { $gt: Date.now() }
    });

    if(!user) {
        throw new ApiError(400, "Invalid or expired reset token");
    }

    if(newPassword !== confirmPassword) {
        throw new ApiError(400, "New password and confirm password do not match");
    }

    user.password = newPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json(new ApiResponse(200, null, "Password reset successfully."));
});

// Update user profile (username/fullname)
const updateUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { username, fullname } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (username) user.username = username;
    if (fullname) user.fullname = fullname;

    await user.save({ validateBeforeSave: false });

    const updatedUser = await User.findById(userId).select("-password -refreshToken -__v -emailVerificationToken -emailVerificationTokenExpiry -refreshTokenExpiry -forgotPasswordToken -forgotPasswordTokenExpiry");

    res.status(200).json(new ApiResponse(200, { user: updatedUser }, "User profile updated successfully."));
});

export {
    generateAccessTokenAndRefreshToken,
    registerUser,
    loginUser,
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
}

/*
 * ===========================================================================================
 *                              NOTES — auth.controllers.js
 * ===========================================================================================
 *
 * PURPOSE: Houses the core business logic for user authentication, registration, and profile management.
 * ROLE IN ARCHITECTURE: Controller layer. Receives sanitized/validated data from routes, interacts with the User model, and returns formatted API responses.
 * 
 * IMPORTS:
 * - `ApiResponse`, `ApiError`, `asyncHandler`: Standardized response formatting and error handling.
 * - `User`: The MongoDB model for user data.
 * - `crypto`, `jwt`: For token generation and verification.
 * - `mail.js`: Utility for sending transactional emails (verification, reset passwords).
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `generateAccessTokenAndRefreshToken`: Helper function. Fetches the user, calls instance methods to generate JWTs, and saves the new refresh token to the DB.
 * - `registerUser`: Checks for duplicates. Creates user. Generates email verification token. Sends welcome/verify email. Returns user without sensitive fields.
 * - `loginUser`: Verifies email and password. Generates tokens. Sets them in HTTP-only cookies and returns them in the payload.
 * - `logoutUser`: Clears the refresh token from the database and clears the cookies from the client.
 * - `verifyEmailToken` & `resetPassword`: Receives a raw token from the URL, hashes it via SHA-256, and compares it to the hash stored in the database.
 * - `refreshAccessToken`: Extracts the refresh token from cookies/headers, verifies its JWT signature, ensures it matches the one stored in the DB, and issues a new token pair.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: `auth.routes.js`.
 * - Outbound dependencies: `user.model.js`, `mail.js`.
 * 
 * DESIGN PATTERNS:
 * - Stateless Authentication: JWTs mean the server doesn't need to keep session memory.
 * - Token Rotation: `refreshAccessToken` generates a *new* refresh token every time it is called, invalidating the old one to prevent replay attacks.
 * - Hashed Token Verification: Email tokens are hashed in the DB. If the DB leaks, attackers cannot instantly verify accounts or reset passwords.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why do we set `{ validateBeforeSave: false }` when saving tokens to the user model?
 *    Answer: Because we are doing partial updates (like just saving a refresh token). We don't want Mongoose to run full schema validation (which might require a password field) when we are only updating token fields.
 * 2. Why send tokens in both cookies and the JSON response during login?
 *    Answer: For client flexibility. Web browsers will automatically use the `httpOnly` cookies (preventing XSS access to tokens). Mobile apps or CLI tools might prefer to extract the token from the JSON and send it via the `Authorization` header.
 * 3. In `refreshAccessToken`, why check if the token matches the database? Isn't verifying the JWT signature enough?
 *    Answer: Verifying the JWT proves the token is valid, but checking the database ensures the token hasn't been explicitly revoked (e.g., if the user logged out, or an admin forced a session reset).
 */
