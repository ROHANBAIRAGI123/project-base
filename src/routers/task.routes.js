import { Router } from "express";
import { z } from "zod";
import {
  validate,
  createValidationLayer,
} from "../middlewares/validation.middleware.js";
import { sanitizeAndValidateInput } from "../middlewares/sanitization.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  taskFilterSchema,
  fileUploadSchema,
} from "../validators/index.js";
import {
  taskResponseSchema,
  taskListResponseSchema,
  successResponseSchema,
} from "../validators/response.schemas.js";
import {
  AvailableTaskStatuses,
  AvailableTaskPriorities,
  UserRolesEnum,
} from "../utils/constants.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createSubTask,
  createTask,
  getTasks,
  getSubTasks,
  getTaskDetails,
  updateTaskById,
  deleteTaskById,
  updateSubtask,
  deleteSubTask,
} from "../controllers/task.controllers.js";
import { checkProjectPermission } from "../middlewares/permission.middleware.js";

const router = Router({ mergeParams: true }); // mergeParams to access projectId

// Create task with comprehensive validation
router
  .route("/")
  .post(
    ...createValidationLayer({
      schema: createTaskSchema,
      sanitize: true,
      validateSecurity: true,
    }),
    verifyJWT, // Ensure user is authenticated
    checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), // Custom middleware to check if user has permissions for the project
    createTask,
  )
  .get(
    // Get tasks with advanced filtering and pagination
    validate(taskFilterSchema),
    verifyJWT,
    checkProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]), // Allow members to view tasks
    getTasks,
  );

// Create subtask with comprehensive validation
router
  .route("/task/:taskId/subtasks")
  .post(
    ...createValidationLayer({
      schema: createTaskSchema,
      sanitize: true,
      validateSecurity: true,
    }),
    validate(deleteTaskSchema), // for taskId validation
    verifyJWT, // Ensure user is authenticated
    checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), // Custom middleware to check if user has permissions for the project
    createSubTask,
  )
  .get(
    // Get subtasks with advanced filtering and pagination
    validate(taskFilterSchema),
    validate(deleteTaskSchema), // for taskId validation
    verifyJWT,
    checkProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]), // Allow members to view tasks
    getSubTasks,
  );

// Get single task
router.route("/task/:taskId").get(
  validate(deleteTaskSchema), // reuse schema for params validation
  verifyJWT,
  checkProjectPermission([
    UserRolesEnum.ADMIN,
    UserRolesEnum.PROJECT_ADMIN,
    UserRolesEnum.MEMBER,
  ]), // Allow members to view tasks
  getTaskDetails,
);

// Update task with comprehensive validation
router
  .route("/task/:taskId")
  .patch(
    ...sanitizeAndValidateInput({
      enableXSSProtection: true,
      enableSQLProtection: true,
      customSanitizers: {
        title: (value) => value?.trim().replace(/[<>]/g, ""),
        description: (value) => value?.trim(),
      },
    }),
    validate(updateTaskSchema),
    verifyJWT,
    checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), // Only admins and project admins can update tasks
    updateTaskById,
  )
  .delete(
    // Delete task
    validate(deleteTaskSchema),
    verifyJWT,
    checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), // Only admins and project admins can delete tasks
    deleteTaskById,
  );

// Update subtask with comprehensive validation
router
  .route("/task/:taskId/subtask/:subTaskId")
  .patch(
    ...sanitizeAndValidateInput({
      enableXSSProtection: true,
      enableSQLProtection: true,
      customSanitizers: {
        title: (value) => value?.trim().replace(/[<>]/g, ""),
        description: (value) => value?.trim(),
      },
    }),
    validate(updateTaskSchema),
    verifyJWT,
    checkProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]), // Only admins and project admins can update tasks
    updateSubtask,
  )
  .delete(
    validate(deleteTaskSchema),
    verifyJWT,
    checkProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), // Only admins and project admins can delete tasks
    deleteSubTask,
  );

//for future implementation of file attachments to tasks, with enhanced validation and security measures
// Task file attachments

// router.route("/task/:taskId/attachments").post(
//   validateFileUpload({
//     allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
//     maxSize: 10 * 1024 * 1024, // 10MB for task attachments
//     maxFiles: 5
//   }),
//   validate(deleteTaskSchema), // for taskId validation
//   // uploadTaskAttachment controller
// );

// // Bulk task operations with enhanced validation
// router.route("/bulk").patch(
//   ...createValidationLayer({
//     schema: z.object({
//       body: z.object({
//         taskIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid task ID format")).min(1, "At least one task ID is required").max(50, "Maximum 50 tasks allowed"),
//         operation: z.enum(['delete', 'update_status', 'update_priority', 'assign'], {
//           errorMap: () => ({ message: "Operation must be one of: delete, update_status, update_priority, assign" })
//         }),
//         data: z.object({
//           status: z.enum(AvailableTaskStatuses).optional(),
//           priority: z.enum(AvailableTaskPriorities).optional(),
//           assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format").optional(),
//         }).optional()
//       }),
//       params: z.object({
//         projectId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid project ID format")
//       })
//     }),
//     sanitize: true
//   }),
//   // bulkUpdateTasks controller
// );

export default router;

/*
 * ===========================================================================================
 *                              NOTES — task.routes.js
 * ===========================================================================================
 *
 * PURPOSE: Maps task and subtask related requests to controllers, ensuring deep authorization checks.
 * ROLE IN ARCHITECTURE: Routing layer. Handles traffic entering via `/api/v1/:projectId` (note the dynamic base path).
 *
 * IMPORTS:
 * - `express.Router({ mergeParams: true })`: Crucial for accessing `projectId` from the parent router mount point.
 * - Task controllers, validation middlewares, RBAC middlewares.
 *
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - Task Routes (`/` under `/:projectId`):
 *   - Creation/Updating/Deletion restricted to ADMIN and PROJECT_ADMIN.
 *   - Viewing (`getTasks`) allowed for all project members.
 * - Subtask Routes (`/task/:taskId/subtasks`):
 *   - Follows the same RBAC logic. Validates both `projectId` (from mergeParams) and `taskId` to ensure hierarchy consistency.
 *
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Mounted in `src/app.js` via `app.use('/api/v1/:projectId', taskRoutes)`.
 * - Outbound dependencies: Delegates to `task.controllers.js`.
 *
 * DESIGN PATTERNS:
 * - Nested Routing Pattern: By mounting the router on `/:projectId`, every task route inherently carries the project context, making the URLs deeply RESTful (e.g., `/api/v1/project123/task/task456`).
 *
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. What does `Router({ mergeParams: true })` do and why is it necessary here?
 *    Answer: Because `app.js` mounts this router on `/api/v1/:projectId`, the `:projectId` parameter belongs to the parent router. Setting `mergeParams: true` allows this child router to access `req.params.projectId`, which is required by the `checkProjectPermission` middleware.
 * 2. Why validate `taskId` using `deleteTaskSchema` on GET routes?
 *    Answer: It's likely a naming shortcut by the developer. `deleteTaskSchema` probably just contains validation that `params.taskId` is a valid MongoId, making it reusable across GET, PATCH, and DELETE.
 * 3. If a user is an Admin in Project A but a Member in Project B, how does the router handle a request to delete a task in Project B?
 *    Answer: The `checkProjectPermission` middleware will look up the user's role specifically for Project B (extracted from the URL), see they are a Member, and throw a 403 Forbidden before the controller executes.
 */
