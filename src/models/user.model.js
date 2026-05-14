import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";  



const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: [ true, "Password is required" ],
        minlength: [ 6, "Password must be at least 6 characters long" ],
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    refreshToken: {
        type: String,
        default: null,
    },
    refreshTokenExpiry: {
        type: Date,
        default: null,
    },
    forgotPasswordToken: {
        type: String,
        default: null,
    },
    forgotPasswordTokenExpiry: {
        type: Date,
        default: null,
    },
    emailVerificationToken: {
        type: String,
        default: null,
    },
    emailVerificationTokenExpiry: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    avatar: {
        type: {
            url: String,
            localPath: String,
        },
        default: {
            url: `https://placehold.co/200x200/png`,
            localPath: ``,
        }
    },
}, {
    timestamps: true,
});

userSchema.index({ username: 1, email: 1 });

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
    const accessToken = jwt.sign(
        { _id: this._id,
            username: this.username,
            email: this.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
    
    const decoded = jwt.decode(accessToken);
    this.accessToken = accessToken;
    this.accessTokenExpiry = new Date(decoded.exp * 1000);

    return accessToken;
}

userSchema.methods.generateRefreshToken = function () {
    const refreshToken = jwt.sign(
        { _id: this._id},
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

    const decoded = jwt.decode(refreshToken);
    this.refreshToken = refreshToken;
    this.refreshTokenExpiry = new Date(decoded.exp * 1000);

    return refreshToken;
}

userSchema.methods.generateEmailVerificationToken = function () {
    const token = crypto.randomBytes(20).toString("hex");
    this.emailVerificationToken = crypto.createHash("sha256").update(token).digest("hex");
    this.emailVerificationTokenExpiry = Date.now() + 20 * 60  * 1000; // 20 minutes
    return token;
}

const User = mongoose.model("User", userSchema);

export default User;

/*
 * ===========================================================================================
 *                              NOTES — user.model.js
 * ===========================================================================================
 *
 * PURPOSE: Defines the schema, behaviors, and data validation rules for the User entity in the database.
 * ROLE IN ARCHITECTURE: Data layer (Model). Represents the core identity of a person interacting with the system.
 * 
 * IMPORTS:
 * - `mongoose`: Core MongoDB ODM library.
 * - `jsonwebtoken`: Used within instance methods to generate access and refresh tokens.
 * - `bcryptjs`: Used to hash passwords before saving them.
 * - `crypto`: Used to generate secure, random strings for email verification tokens.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `userSchema.pre("save")`: Mongoose hook.
 *   - What it does: Automatically intercepts any save operation. If the `password` field was modified, it generates a salt and hashes the password using `bcrypt` before storing it in the DB.
 *   - Edge cases: Returns early if the password wasn't modified (e.g., when updating only a username) to prevent double-hashing.
 * - `comparePassword(candidatePassword)`: Instance method.
 *   - What it does: Compares a plaintext password attempt with the stored hashed password.
 *   - Returns: Boolean.
 * - `generateAccessToken()` / `generateRefreshToken()`: Instance methods.
 *   - What they do: Sign JWTs containing the user's ID (and email/username for access tokens). Also decodes the generated token to save its exact expiry date in the DB.
 *   - Side effects: Modifies the document instance (setting `refreshToken`, `refreshTokenExpiry`, etc.).
 * - `generateEmailVerificationToken()`: Instance method.
 *   - What it does: Generates a cryptographically secure random hex string, hashes it with SHA-256 for storage, and sets a 20-minute expiry.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Imported globally by all auth/user controllers, and referenced via `ref: "User"` by virtually every other model (Project, Task, Note).
 * - Outbound dependencies: Depends on environment variables (`ACCESS_TOKEN_SECRET`, etc.).
 * 
 * DESIGN PATTERNS:
 * - Active Record / Rich Model Pattern: The model isn't just an empty schema; it encapsulates its own business logic (password hashing, token generation), keeping controllers thin.
 * - Data Masking via Hashing: Stores SHA-256 hashes of verification/reset tokens rather than the raw tokens, protecting against database leaks.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why do we store a hashed version of the verification token in the DB but send the raw token via email?
 *    Answer: If the database is compromised, the attacker only gets the hash and cannot instantly verify accounts or reset passwords. Only the user with the email gets the raw token, which is hashed at runtime to compare.
 * 2. Why is there a compound index on `{ username: 1, email: 1 }`?
 *    Answer: Because the login controller allows logging in with *either* username or email. This index optimizes the `$or` query used during login.
 * 3. What is the benefit of the `pre("save")` hook for password hashing?
 *    Answer: It centralizes the hashing logic. Whether a user is created via registration, admin panel, or a seed script, the password will always be hashed, eliminating the risk of a developer forgetting to call a hash function.
 */