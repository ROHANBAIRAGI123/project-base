import mongoose from "mongoose";
import crypto from "crypto";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const projectInvitationSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    role: {
        type: String,
        enum: AvailableUserRole,
        default: UserRolesEnum.MEMBER
    },
    invitationToken: {
        type: String,
    },
    invitationTokenExpiry: {
        type: Date,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "expired"],
        default: "pending"
    }
}, { timestamps: true });

// Generate invitation token
projectInvitationSchema.methods.generateInvitationToken = function () {
    const token = crypto.randomBytes(20).toString("hex");
    this.invitationToken = crypto.createHash("sha256").update(token).digest("hex");
    this.invitationTokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    return token;
};

export const ProjectInvitation = mongoose.model("ProjectInvitation", projectInvitationSchema);
