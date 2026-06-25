import { Router } from "express";
import {
  validate,
  createValidationLayer,
  validateResponse,
} from "../middlewares/validation.middleware.js";
import { sanitizeAndValidateInput } from "../middlewares/sanitization.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberToProjectSchema,
  removeMemberFromProjectSchema,
  updateMemberRoleSchema,
  paginationSchema,
  mongoIdParamSchema,
} from "../validators/index.js";
import {
  projectResponseSchema,
  projectListResponseSchema,
  successResponseSchema,
} from "../validators/response.schemas.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers,
  updateMemberRole,
  removeMember,
} from "../controllers/project.controllers.js";
import { checkProjectPermission } from "../middlewares/permission.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";

const router = Router();

// Create project route with full validation layers
router
  .route("/")
  .post(
    ...sanitizeAndValidateInput({
      enableXSSProtection: true,
      enableSQLProtection: true,
      maxRequestSize: 2 * 1024 * 1024, // 2MB for projects
      customSanitizers: {
        name: (value) => value?.trim().replace(/[^\w\s\-_]/g, ""),
        description: (value) => value?.trim().replace(/[<>]/g, ""),
      },
    }),
    validate(createProjectSchema),
    process.env.NODE_ENV === "development"
      ? validateResponse(successResponseSchema)
      : (req, res, next) => next(),
    verifyJWT,
    createProject,
  )
  .get(
    validate(paginationSchema),
    validateResponse(projectListResponseSchema),
    verifyJWT,
    getProjects,
  );

// Get single project
router
  .route("/:projectId")
  .get(
    validate(mongoIdParamSchema),
    validateResponse(successResponseSchema),
    verifyJWT,
    checkProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.MEMBER,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    getProjectById,
  )
  .delete(
    validate(mongoIdParamSchema),
    validateResponse(successResponseSchema),
    verifyJWT,
    checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
    deleteProject,
  )
  .patch(
    ...sanitizeAndValidateInput(),
    validate(updateProjectSchema),
    validateResponse(successResponseSchema),
    verifyJWT,
    checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
    updateProject,
  );

// Project member management routes
router
  .route("/:projectId/members")
  .get(
    validate(mongoIdParamSchema),
    validateResponse(successResponseSchema),
    verifyJWT,
    checkProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.MEMBER,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    getProjectMembers,
  );

router
  .route("/:projectId/members/:userId")
  .delete(
    validate(removeMemberFromProjectSchema),
    validateResponse(successResponseSchema),
    verifyJWT,
    checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
    removeMember,
  )
  .patch(
    ...createValidationLayer({
      schema: updateMemberRoleSchema,
      sanitize: true,
      validateSecurity: true,
    }),
    validateResponse(successResponseSchema),
    verifyJWT,
    checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
    updateMemberRole,
  );

export default router;

/*
 * ===========================================================================================
 *                              NOTES — project.routes.js
 * ===========================================================================================
 *
 * PURPOSE: Maps project-related HTTP requests to their respective controllers, enforcing project-level RBAC.
 * ROLE IN ARCHITECTURE: Routing layer. Directs traffic entering via `/api/v1/projects`.
 *
 * IMPORTS:
 * - `express.Router`: Router factory.
 * - Validation middlewares and schemas: To ensure clean data.
 * - `verifyJWT`: To ensure the user is logged in.
 * - `checkProjectPermission`: To ensure the user has the right project-specific role.
 * - Project controllers.
 *
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `POST /` (Create Project): Requires JWT. No specific project role needed (since the project doesn't exist yet). Sanitizes name/description.
 * - `GET /:projectId`, `DELETE /:projectId`, `PATCH /:projectId`:
 *   - Require `verifyJWT`.
 *   - Require `checkProjectPermission` with specific roles (e.g., only ADMIN/PROJECT_ADMIN can delete).
 * - Member Routes (`/:projectId/members/*`):
 *   - Allow viewing members for everyone in the project.
 *   - Restrict updating/removing members to Admins only.
 *
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Mounted in `src/app.js` under `/api/v1/projects`.
 * - Outbound dependencies: Delegates to `project.controllers.js`.
 *
 * DESIGN PATTERNS:
 * - Chain of Responsibility: A request must pass JWT validation -> Parameter Validation -> RBAC Permission Check -> Body Validation -> Controller. If any link breaks, the chain halts and throws an ApiError.
 *
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why does `createProject` not use `checkProjectPermission`?
 *    Answer: Because `checkProjectPermission` looks up the user's role in an existing project based on `req.params.projectId`. When creating a project, there is no ID yet, and the creator automatically becomes the Admin during the controller logic.
 * 2. Why are both `verifyJWT` and `checkProjectPermission` used? Doesn't permission checking imply they are logged in?
 *    Answer: `verifyJWT` parses the token and sets `req.user`. `checkProjectPermission` *relies* on `req.user` existing to query the database. They must run in sequence.
 * 3. Why are route parameters (`/:projectId`) validated with Zod (`mongoIdParamSchema`)?
 *    Answer: If a client sends `/projects/invalid-id-format`, Mongoose will throw a cast error when trying to look it up. Validating it as a valid 24-char hex string fails the request early with a clean 400 Bad Request.
 */
