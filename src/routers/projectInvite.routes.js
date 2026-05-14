import { Router } from "express";
import { validate, createValidationLayer, validateResponse } from "../middlewares/validation.middleware.js";
import { sanitizeAndValidateInput } from "../middlewares/sanitization.middleware.js";
import {
  addMemberToProjectSchema,
  mongoIdParamSchema
} from "../validators/index.js";
import {
  successResponseSchema
} from "../validators/response.schemas.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";
import { checkProjectPermission } from "../middlewares/permission.middleware.js";
import {
  sendProjectInvitation,
  acceptProjectInvitation,
  rejectProjectInvitation,
  getProjectInvitations,
  getUserPendingInvitations,
  resendProjectInvitation,
  cancelProjectInvitation,
} from "../controllers/projectInvite.controllers.js";

const router = Router();

// Send project invitation (invite a user to join a project)
router.route("/:projectId/invite").post(
  ...createValidationLayer({
    schema: addMemberToProjectSchema,
    sanitize: true,
    validateSecurity: true
  }),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
  sendProjectInvitation,
);

// Accept invitation via email link (public - token based)
router.route("/accept/:invitationToken").get(
  acceptProjectInvitation,
);

// Reject invitation via email link (public - token based)
router.route("/reject/:invitationToken").get(
  rejectProjectInvitation,
);

// Get all invitations for a specific project
router.route("/:projectId/invitations").get(
  validate(mongoIdParamSchema),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
  getProjectInvitations,
);

// Get current user's pending invitations
router.route("/user/pending").get(
  verifyJWT,
  getUserPendingInvitations
);

// Resend invitation email
router.route("/:invitationId/resend").post(
  validate(mongoIdParamSchema),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
  resendProjectInvitation
);

// Cancel a pending invitation
router.route("/:invitationId/cancel").delete(
  validate(mongoIdParamSchema),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
  cancelProjectInvitation
);

export default router;

/*
 * ===========================================================================================
 *                              NOTES — projectInvite.routes.js
 * ===========================================================================================
 *
 * PURPOSE: Manages the routing for sending, accepting, rejecting, and listing project invitations.
 * ROLE IN ARCHITECTURE: Routing layer. Facilitates the complex state machine of the invitation system.
 * 
 * IMPORTS:
 * - RBAC middlewares, Validation middlewares.
 * - Invitation controllers.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `/accept/:invitationToken` and `/reject/:invitationToken`:
 *   - Public GET routes. No `verifyJWT` required. This allows users to click a link in their email and accept/reject the invite without needing to log in first (or the login happens via redirect later on the frontend).
 * - `/:projectId/invite`, `/:projectId` (GET), `/:invitationId/resend`, `/:invitationId/cancel`:
 *   - Protected routes requiring `verifyJWT` and `checkProjectPermission` (Admin only).
 * - `/user/pending`:
 *   - Requires `verifyJWT` but NO project permission, because it lists all invites for the current user across *all* projects.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Mounted in `src/app.js` under `/api/v1/projects` (making the full path `/api/v1/projects/:projectId/invite`, etc.).
 * - Outbound dependencies: Delegates to `projectInvite.controller.js`.
 * 
 * DESIGN PATTERNS:
 * - Token-Based Action Pattern: The accept/reject routes rely entirely on a secure cryptographic token embedded in the URL rather than a session cookie, enabling email-driven workflows.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why are accept/reject routes `GET` requests instead of `POST`?
 *    Answer: Because they are designed to be clicked directly from an email client, which natively sends a GET request. If they were POST, the email would need to link to a frontend page which then fires the POST request.
 * 2. Why does `/user/pending` not require `checkProjectPermission`?
 *    Answer: Because the user hasn't accepted the invitations yet, they don't have a record in `ProjectMember`. The query simply looks up invitations where `invitedUser === req.user._id`.
 */
