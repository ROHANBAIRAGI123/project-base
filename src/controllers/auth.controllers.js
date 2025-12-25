import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import  User  from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { emailVerificationMailgenContent,sendEmail } from "../utils/mail.js";
import { options } from "../utils/constants.js";

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

export {
    generateAccessTokenAndRefreshToken,
    registerUser,
    loginUser,
}