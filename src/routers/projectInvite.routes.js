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

const router = Router();

// Send project invitation (invite a user to join a project)
router.route("/:projectId/invite").post(
  ...createValidationLayer({
    schema: addMemberToProjectSchema,
    sanitize: true,
    validateSecurity: true
  }),
  // sendProjectInvitation
);

// Accept invitation via email link (public - token based)
router.route("/accept/:invitationToken").get(
  // acceptProjectInvitation
);

// Reject invitation via email link (public - token based)
router.route("/reject/:invitationToken").get(
  // rejectProjectInvitation
);

// Get all invitations for a specific project
router.route("/:projectId").get(
  validate(mongoIdParamSchema),
  // getProjectInvitations
);

// Get current user's pending invitations
router.route("/user/pending").get(
  // getUserPendingInvitations
);

// Resend invitation email
router.route("/:invitationId/resend").post(
  validate(mongoIdParamSchema),
  // resendProjectInvitation
);

// Cancel a pending invitation
router.route("/:invitationId/cancel").delete(
  validate(mongoIdParamSchema),
  // cancelProjectInvitation
);

export default router;
