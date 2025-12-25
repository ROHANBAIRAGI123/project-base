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
