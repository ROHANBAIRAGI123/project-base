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

const router = Router();

// Create project route with full validation layers
router.route("/").post(
  // Apply comprehensive sanitization and security validation
  ...sanitizeAndValidateInput({
    enableXSSProtection: true,
    enableSQLProtection: true,
    maxRequestSize: 2 * 1024 * 1024, // 2MB for projects
    customSanitizers: {
      name: (value) => value?.trim().replace(/[^\w\s\-_]/g, ''),
      description: (value) => value?.trim().replace(/[<>]/g, '')
    }
  }),
  
  // Apply Zod schema validation
  validate(createProjectSchema),
  
  // Apply response validation in development
  process.env.NODE_ENV === 'development' ? validateResponse(successResponseSchema) : (req, res, next) => next(),
  
  // Project controller (to be implemented)
  // createProject
);

// Get all projects with pagination and filtering
router.route("/").get(
  validate(paginationSchema),
  validateResponse(projectListResponseSchema),
  // getProjects
);

// Get single project
router.route("/:id").get(
  validate(mongoIdParamSchema),
  validateResponse(successResponseSchema),
  // getProject
);

// Update project with enhanced validation
router.route("/:projectId").patch(
  ...sanitizeAndValidateInput(),
  validate(updateProjectSchema),
  validateResponse(successResponseSchema),
  // updateProject
);

// Delete project
router.route("/:id").delete(
  validate(mongoIdParamSchema),
  validateResponse(successResponseSchema),
  // deleteProject
);

// Project member management routes
router.route("/:projectId/members").post(
  ...createValidationLayer({
    schema: addMemberToProjectSchema,
    sanitize: true,
    validateSecurity: true
  }),
  // addMemberToProject
);

router.route("/:projectId/members/:memberId").delete(
  validate(removeMemberFromProjectSchema),
  // removeMemberFromProject
);

router.route("/:projectId/members/:memberId/role").patch(
  validate(updateMemberRoleSchema),
  // updateMemberRole
);

export default router;