import { Router } from "express";
import { validate, createValidationLayer, validateResponse } from "../middlewares/validation.middleware.js";
import { sanitizeAndValidateInput } from "../middlewares/sanitization.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberToProjectSchema,
  removeMemberFromProjectSchema,
  updateMemberRoleSchema,
  paginationSchema,
  mongoIdParamSchema
} from "../validators/index.js";
import {
  projectResponseSchema,
  projectListResponseSchema,
  successResponseSchema
} from "../validators/response.schemas.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getProjects,
    createProject,
    getProjectById,
    updateProject,
    deleteProject,
    getProjectMembers,
    updateMemberRole,
    removeMember} from "../controllers/project.controllers.js";
import { checkProjectPermission } from "../middlewares/permission.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";

const router = Router();

// Create project route with full validation layers
router.route("/").post(

  ...sanitizeAndValidateInput({
    enableXSSProtection: true,
    enableSQLProtection: true,
    maxRequestSize: 2 * 1024 * 1024, // 2MB for projects
    customSanitizers: {
      name: (value) => value?.trim().replace(/[^\w\s\-_]/g, ''),
      description: (value) => value?.trim().replace(/[<>]/g, '')
    }
  }),
  validate(createProjectSchema),
  process.env.NODE_ENV === 'development' ? validateResponse(successResponseSchema) : (req, res, next) => next(),
  verifyJWT,
  createProject,
).get(
  validate(paginationSchema),
  validateResponse(projectListResponseSchema),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER, UserRolesEnum.PROJECT_ADMIN]),
  getProjects
);

// Get single project
router.route("/:projectId").get(
  validate(mongoIdParamSchema),
  validateResponse(successResponseSchema),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER, UserRolesEnum.PROJECT_ADMIN]),
  getProjectById
).delete(
  validate(mongoIdParamSchema),
  validateResponse(successResponseSchema),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
  deleteProject
).patch(
  ...sanitizeAndValidateInput(),
  validate(updateProjectSchema),
  validateResponse(successResponseSchema),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
  updateProject
);

// Project member management routes
router.route("/:projectId/members").get(
  validate(mongoIdParamSchema),
  validateResponse(successResponseSchema),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER, UserRolesEnum.PROJECT_ADMIN]),
  getProjectMembers
);

router.route("/:projectId/members/:userId").delete(
  validate(removeMemberFromProjectSchema),
  validateResponse(successResponseSchema),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
  removeMember
).patch(
  ...createValidationLayer({
    schema: updateMemberRoleSchema,
    sanitize: true,
    validateSecurity: true
  }),
  validateResponse(successResponseSchema),
  verifyJWT,
  checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
  updateMemberRole
);

export default router;