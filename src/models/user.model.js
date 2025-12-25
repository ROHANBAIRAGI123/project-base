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
    refreshTokens: {
        type: String,
        default: null,
    },
    refreshTokensExpiry: {
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
    return jwt.sign(
        { _id: this._id,
            username: this.username,
            email: this.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id},
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
}

userSchema.methods.generateEmailVerificationToken = function () {
    const token = crypto.randomBytes(20).toString("hex");
    this.emailVerificationToken = crypto.createHash("sha256").update(token).digest("hex");
    this.emailVerificationTokenExpiry = Date.now() + 20 * 60  * 1000; // 20 minutes
    return token;
}

const User = mongoose.model("User", userSchema);

export default User;