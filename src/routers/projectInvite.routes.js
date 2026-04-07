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
import {sendProjectInvitation,
    acceptProjectInvitation,
    rejectProjectInvitation,
    getProjectInvitations,
    getUserPendingInvitations,
    resendProjectInvitation,
    cancelProjectInvitation,} from "../controllers/projectInvite.controller.js";

const router = Router();

// Send project invitation (invite a user to join a project)
router.route("/:projectId/invite").post(
  ...createValidationLayer({
    schema: addMemberToProjectSchema,
    sanitize: true,
    validateSecurity: true
  }),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN,UserRolesEnum.PROJECT_ADMIN]),
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
router.route("/:projectId").get(
  validate(mongoIdParamSchema),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN,UserRolesEnum.PROJECT_ADMIN]),
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
  checkProjectPermission([UserRolesEnum.ADMIN,UserRolesEnum.PROJECT_ADMIN]),
  resendProjectInvitation
);

// Cancel a pending invitation
router.route("/:invitationId/cancel").delete(
  validate(mongoIdParamSchema),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN,UserRolesEnum.PROJECT_ADMIN]),
  cancelProjectInvitation
);

export default router;
