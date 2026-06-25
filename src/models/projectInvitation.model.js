import mongoose from "mongoose";
import crypto from "crypto";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const projectInvitationSchema = new mongoose.Schema(
  {
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
      default: UserRolesEnum.MEMBER,
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
      default: "pending",
    },
  },
  { timestamps: true },
);

// Generate invitation token
projectInvitationSchema.methods.generateInvitationToken = function () {
  const token = crypto.randomBytes(20).toString("hex");
  this.invitationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.invitationTokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  return token;
};

export const ProjectInvitation = mongoose.model(
  "ProjectInvitation",
  projectInvitationSchema,
);

/*
 * ===========================================================================================
 *                              NOTES — projectInvitation.model.js
 * ===========================================================================================
 *
 * PURPOSE: Tracks pending, accepted, and rejected invitations sent to users to join projects.
 * ROLE IN ARCHITECTURE: Data layer. Manages the state machine of the invitation workflow.
 *
 * IMPORTS:
 * - `mongoose`: Core MongoDB ODM library.
 * - `crypto`: Used for generating secure invitation tokens.
 * - `AvailableUserRole`: Enforces valid roles for the invitation.
 *
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `generateInvitationToken()`: Instance method.
 *   - What it does: Generates a random 20-byte hex string. Hashes it with SHA-256 for secure storage. Sets an expiry date 7 days into the future.
 *   - Returns: The raw, unhashed token to be sent in the email link.
 *
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Used by `projectInvite.controllers.js`.
 * - Outbound dependencies: References `Project`, `User` (the invitee), and `User` (the inviter).
 *
 * DESIGN PATTERNS:
 * - State Machine Pattern: The `status` field explicitly tracks the lifecycle of an invitation ("pending", "accepted", "rejected", "expired").
 * - Hashed Token Storage: Similar to the user verification flow, stores a hashed version of the token to prevent malicious acceptance if the database is leaked.
 *
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why track the `invitedBy` user?
 *    Answer: For audit logging and user experience. The invitation email can say "Alice invited you", and if the invitation is abused, admins know exactly which user initiated it.
 * 2. Why use a state machine (`status` enum) instead of just deleting the invitation when it's rejected?
 *    Answer: Soft-deleting or marking as 'rejected' provides an audit trail. It prevents an inviter from spamming a user with invites if they can see the user explicitly rejected it, and helps track team growth metrics.
 * 3. How does the 7-day expiration work mechanically?
 *    Answer: The `generateInvitationToken` sets the `invitationTokenExpiry` field. When the user clicks the accept link, the controller must manually verify that `Date.now()` is less than `invitationTokenExpiry`. Alternatively, a MongoDB TTL index could be used to automatically delete expired documents.
 */
