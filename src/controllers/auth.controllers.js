import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import  User  from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { emailVerificationMailgenContent,sendEmail } from "../utils/mail.js";
import { options } from "../utils/constants.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

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

const loginUser = asyncHandler(async (req, res) => {
    // Implementation for user login
    const {email, password} = req.body;
    
    const user = await User.findOne({email});
    if(!user) {
        throw new ApiError(401, "Invalid email");
    }

    const isPasswordValid = await user.comparePassword(password);
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);
    
    const userData = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry");

    res.status(201)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200, {user: userData, accessToken, refreshToken}, "User logged in successfully."));
});

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } }, { new: true });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    await user.save({ validateBeforeSave: false });

    res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully."));
});

const deleteUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body;

    const user = await User.findOne({email});
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

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password -refreshToken -__v -_id -emailVerificationToken -emailVerificationTokenExpiry -createdAt -updatedAt -refreshTokenExpiry -forgotPasswordToken -forgotPasswordTokenExpiry -isEmailVerified -avatar");
    res.status(200).json(new ApiResponse(200, {users}, "Users fetched successfully."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password -refreshToken -__v -emailVerificationToken -emailVerificationTokenExpiry -refreshTokenExpiry -forgotPasswordToken -forgotPasswordTokenExpiry");
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    res.status(200).json(new ApiResponse(200, { user }, "User fetched successfully."));
});

const verifyEmailToken = asyncHandler(async (req, res) => {
    const {verificationToken} = req.params;

    if(!verificationToken) {
        throw new ApiError(400, "Verification token is required");
    }

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

    // Send verification email
    const verificationLink = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${temporaryToken}`;
    await sendEmail({
        email: user.email,
        subject: "Email Verification",
        mailgenContent: emailVerificationMailgenContent(user.username, verificationLink)
    });

    res.status(200).json(new ApiResponse(200, null, "Verification email sent successfully."));
});

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
    refreshAccessToken
}