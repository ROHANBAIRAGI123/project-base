import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectMember.model.js";
import { ProjectInvitation } from "../models/projectInvitation.model.js";
import { ApiError } from "../utils/ApiError.js";
import { projectInvitationMailgenContent, sendEmail } from "../utils/mail.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { UserRolesEnum } from "../utils/constants.js";
import User from "../models/user.model.js";

const sendProjectInvitation = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { userId, role } = req.body;

    // Check if user exists
    const userToInvite = await User.findById(userId);
    if (!userToInvite) {
        throw new ApiError(404, "User not found");
    }

    // Check if user is already a member
    const existingMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId)
    });

    if (existingMember) {
        throw new ApiError(400, "User is already a member of the project");
    }

    // Check if there's already a pending invitation
    const existingInvitation = await ProjectInvitation.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        invitedUser: new mongoose.Types.ObjectId(userId),
        status: "pending"
    });

    if (existingInvitation) {
        throw new ApiError(400, "An invitation is already pending for this user");
    }

    // Get project details for the email
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Create invitation
    const invitation = new ProjectInvitation({
        project: new mongoose.Types.ObjectId(projectId),
        invitedUser: new mongoose.Types.ObjectId(userId),
        invitedBy: new mongoose.Types.ObjectId(req.user._id),
        role: role || UserRolesEnum.MEMBER
    });

    const invitationToken = invitation.generateInvitationToken();
    await invitation.save();

    // Send invitation email
    const acceptLink = `${req.protocol}://${req.get('host')}/api/v1/invitations/accept/${invitationToken}`;
    const rejectLink = `${req.protocol}://${req.get('host')}/api/v1/invitations/reject/${invitationToken}`;

    await sendEmail({
        email: userToInvite.email,
        subject: `Invitation to join project: ${project.name}`,
        mailgenContent: projectInvitationMailgenContent(
            userToInvite.username,
            project.name,
            req.user.username,
            acceptLink,
            rejectLink
        )
    });

    return res.status(201).json(new ApiResponse(201, invitation, "Invitation sent successfully"));
});

const acceptProjectInvitation = asyncHandler(async (req, res) => {
    const { invitationToken } = req.params;

    if (!invitationToken) {
        throw new ApiError(400, "Invitation token is required");
    }

    // Hash token to match stored hash
    const hashedToken = crypto.createHash("sha256").update(invitationToken).digest("hex");

    const invitation = await ProjectInvitation.findOne({
        invitationToken: hashedToken,
        invitationTokenExpiry: { $gt: Date.now() },
        status: "pending"
    });

    if (!invitation) {
        throw new ApiError(400, "Invalid or expired invitation token");
    }

    // Check if user is already a member (in case they were added through another way)
    const existingMember = await ProjectMember.findOne({
        project: invitation.project,
        user: invitation.invitedUser
    });

    if (existingMember) {
        invitation.status = "accepted";
        await invitation.save();
        throw new ApiError(400, "User is already a member of the project");
    }

    // Add user to project
    const newMember = await ProjectMember.create({
        project: invitation.project,
        user: invitation.invitedUser,
        role: invitation.role
    });

    // Update project member count
    await Project.findByIdAndUpdate(
        invitation.project,
        { $inc: { totalMembers: 1 } },
        { new: true }
    );

    // Update invitation status
    invitation.status = "accepted";
    invitation.invitationToken = undefined;
    invitation.invitationTokenExpiry = undefined;
    await invitation.save();

    return res.status(200).json(new ApiResponse(200, newMember, "Invitation accepted. You are now a member of the project"));
});

const rejectProjectInvitation = asyncHandler(async (req, res) => {
    const { invitationToken } = req.params;

    if (!invitationToken) {
        throw new ApiError(400, "Invitation token is required");
    }

    // Hash token to match stored hash
    const hashedToken = crypto.createHash("sha256").update(invitationToken).digest("hex");

    const invitation = await ProjectInvitation.findOne({
        invitationToken: hashedToken,
        invitationTokenExpiry: { $gt: Date.now() },
        status: "pending"
    });

    if (!invitation) {
        throw new ApiError(400, "Invalid or expired invitation token");
    }

    // Update invitation status
    invitation.status = "rejected";
    invitation.invitationToken = undefined;
    invitation.invitationTokenExpiry = undefined;
    await invitation.save();

    return res.status(200).json(new ApiResponse(200, null, "Invitation rejected"));
});

const getProjectInvitations = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const invitations = await ProjectInvitation.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "invitedUser",
                foreignField: "_id",
                as: "invitedUserData"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "invitedBy",
                foreignField: "_id",
                as: "invitedByData"
            }
        },
        { $unwind: "$invitedUserData" },
        { $unwind: "$invitedByData" },
        {
            $project: {
                _id: 1,
                status: 1,
                role: 1,
                createdAt: 1,
                invitedUser: {
                    _id: "$invitedUserData._id",
                    username: "$invitedUserData.username",
                    email: "$invitedUserData.email"
                },
                invitedBy: {
                    _id: "$invitedByData._id",
                    username: "$invitedByData.username"
                }
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, invitations, "Project invitations fetched successfully"));
});

const getUserPendingInvitations = asyncHandler(async (req, res) => {
    const invitations = await ProjectInvitation.aggregate([
        {
            $match: {
                invitedUser: new mongoose.Types.ObjectId(req.user._id),
                status: "pending"
            }
        },
        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "projectData"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "invitedBy",
                foreignField: "_id",
                as: "invitedByData"
            }
        },
        { $unwind: "$projectData" },
        { $unwind: "$invitedByData" },
        {
            $project: {
                _id: 1,
                status: 1,
                role: 1,
                createdAt: 1,
                project: {
                    _id: "$projectData._id",
                    name: "$projectData.name",
                    description: "$projectData.description"
                },
                invitedBy: {
                    _id: "$invitedByData._id",
                    username: "$invitedByData.username"
                }
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, invitations, "Pending invitations fetched successfully"));
});

const resendProjectInvitation = asyncHandler(async (req, res) => {
    const { invitationId } = req.params;

    const invitation = await ProjectInvitation.findById(invitationId);
    if (!invitation) {
        throw new ApiError(404, "Invitation not found");
    }

    // Verify user is an admin or project admin for this project
    const userRole = await ProjectMember.findOne({
        project: invitation.project,
        user: req.user._id
    });
    if (!userRole || ![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(userRole.role)) {
        throw new ApiError(403, "You do not have permission to resend invitations for this project");
    }

    if (invitation.status !== "pending") {
        throw new ApiError(400, "Can only resend pending invitations");
    }

    // Get project and user details
    const project = await Project.findById(invitation.project);
    const userToInvite = await User.findById(invitation.invitedUser);

    if (!project || !userToInvite) {
        throw new ApiError(404, "Project or user not found");
    }

    // Generate new token
    const invitationToken = invitation.generateInvitationToken();
    await invitation.save();

    // Send invitation email
    const acceptLink = `${req.protocol}://${req.get('host')}/api/v1/invitations/accept/${invitationToken}`;
    const rejectLink = `${req.protocol}://${req.get('host')}/api/v1/invitations/reject/${invitationToken}`;

    await sendEmail({
        email: userToInvite.email,
        subject: `Reminder: Invitation to join project: ${project.name}`,
        mailgenContent: projectInvitationMailgenContent(
            userToInvite.username,
            project.name,
            req.user.username,
            acceptLink,
            rejectLink
        )
    });

    return res.status(200).json(new ApiResponse(200, invitation, "Invitation resent successfully"));
});

const cancelProjectInvitation = asyncHandler(async (req, res) => {
    const { invitationId } = req.params;

    const invitation = await ProjectInvitation.findById(invitationId);
    if (!invitation) {
        throw new ApiError(404, "Invitation not found");
    }

    // Verify user is an admin or project admin for this project
    const userRole = await ProjectMember.findOne({
        project: invitation.project,
        user: req.user._id
    });
    if (!userRole || ![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(userRole.role)) {
        throw new ApiError(403, "You do not have permission to cancel invitations for this project");
    }

    if (invitation.status !== "pending") {
        throw new ApiError(400, "Can only cancel pending invitations");
    }

    await ProjectInvitation.findByIdAndDelete(invitationId);

    return res.status(200).json(new ApiResponse(200, null, "Invitation cancelled successfully"));
});

export {
    sendProjectInvitation,
    acceptProjectInvitation,
    rejectProjectInvitation,
    getProjectInvitations,
    getUserPendingInvitations,
    resendProjectInvitation,
    cancelProjectInvitation,
};

/*
 * ===========================================================================================
 *                              NOTES — projectInvite.controllers.js
 * ===========================================================================================
 *
 * PURPOSE: Handles the business logic for the project invitation lifecycle (send, accept, reject, list, resend, cancel).
 * ROLE IN ARCHITECTURE: Controller layer. Manages the state machine of `ProjectInvitation`.
 * 
 * IMPORTS:
 * - `ProjectInvitation`, `ProjectMember`, `Project`, `User`: Models.
 * - `crypto`: For token hashing.
 * - `mail.js`: For sending invitation emails via Nodemailer.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `sendProjectInvitation`: Validates the user exists, isn't already a member, and doesn't have a pending invite. Creates the invite, generates a token, and sends an email.
 * - `acceptProjectInvitation`: Receives a raw token. Hashes it to find the pending invite in the DB. Adds the user to `ProjectMember`. Increments the Project's `totalMembers` counter. Marks the invite as "accepted".
 * - `rejectProjectInvitation`: Finds the invite via hashed token and updates the status to "rejected".
 * - `getProjectInvitations` / `getUserPendingInvitations`: Uses MongoDB aggregation to join User and Project data to present human-readable invitation lists (who invited whom to what).
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: `projectInvite.routes.js`.
 * - Outbound dependencies: `mail.js` for outbound communications.
 * 
 * DESIGN PATTERNS:
 * - Idempotency Checks: `sendProjectInvitation` strictly checks if an invitation or membership already exists before proceeding, preventing duplicate records.
 * - Token-Based Verification: Relies on cryptographically secure, time-bound tokens rather than requiring users to manually log in and click "accept" in a UI dashboard.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why do we manually `$inc: { totalMembers: 1 }` in `acceptProjectInvitation`?
 *    Answer: MongoDB doesn't automatically maintain count metrics. While we could count `ProjectMember` records dynamically every time, storing `totalMembers` on the Project model is a caching strategy (denormalization) for faster read performance on project lists.
 * 2. What happens if a user is invited, but an admin manually adds them to the project via the DB before they click accept?
 *    Answer: The `acceptProjectInvitation` method explicitly checks `ProjectMember` before adding them. If they are already a member, it marks the invite as accepted and stops, preventing duplicate `ProjectMember` records and unique index violations.
 * 3. Why hash the invitation token in the database?
 *    Answer: Standard security practice. If the database is compromised, an attacker can't use the pending invitations to join projects as those users. They would need the raw tokens sent in the emails.
 */
