import { Router } from "express";
import { z } from "zod";
import { validate, createValidationLayer } from "../middlewares/validation.middleware.js";
import { sanitizeAndValidateInput, validateFileUpload } from "../middlewares/sanitization.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  taskFilterSchema,
  fileUploadSchema
} from "../validators/index.js";
import {
  taskResponseSchema,
  taskListResponseSchema,
  successResponseSchema
} from "../validators/response.schemas.js";
import { AvailableTaskStatuses, AvailableTaskPriorities } from "../utils/constants.js";

const router = Router({ mergeParams: true }); // mergeParams to access projectId

// Create task with comprehensive validation
router.route("/").post(
  // Multi-layer validation
  ...createValidationLayer({
    schema: createTaskSchema,
    sanitize: true,
    validateSecurity: true
  }),

  // createTask controller
);

// Create subtask with comprehensive validation
router.route("/subtask/:taskId/subtask").post(
  // Multi-layer validation
  ...createValidationLayer({
    schema: createTaskSchema,
    sanitize: true,
    validateSecurity: true
  }),

  // createTask controller
);

// Get tasks with advanced filtering and pagination
router.route("/").get(
  validate(taskFilterSchema),
  // getTasks controller
);

// Get subtask with advanced filtering and pagination
router.route("/subtask/:taskId/:subTaskId").get(
  validate(taskFilterSchema),
  // getTasks controller
);

// Get single task
router.route("/task/:taskId").get(
  validate(deleteTaskSchema), // reuse schema for params validation
  // getTask controller
);

// Update task with comprehensive validation
router.route("/task/:taskId").patch(
  ...sanitizeAndValidateInput({
    enableXSSProtection: true,
    enableSQLProtection: true,
    customSanitizers: {
      title: (value) => value?.trim().replace(/[<>]/g, ''),
      description: (value) => value?.trim()
    }
  }),
  validate(updateTaskSchema),
  // updateTask controller
);

// Update subtask with comprehensive validation
router.route("/subtask/:taskId/:subTaskId").patch(
  ...sanitizeAndValidateInput({
    enableXSSProtection: true,
    enableSQLProtection: true,
    customSanitizers: {
      title: (value) => value?.trim().replace(/[<>]/g, ''),
      description: (value) => value?.trim()
    }
  }),
  validate(updateTaskSchema),
  // updateTask controller
);

// Delete task
router.route("/task/:taskId").delete(
  validate(deleteTaskSchema),
  // deleteTask controller
);

// Delete subtask
router.route("/subtask/:taskId/:subTaskId").delete(
  validate(deleteTaskSchema),
  // delete SubTask controller
);

// Task file attachments
router.route("/task/:taskId/attachments").post(
  validateFileUpload({
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
    maxSize: 10 * 1024 * 1024, // 10MB for task attachments
    maxFiles: 5
  }),
  validate(deleteTaskSchema), // for taskId validation
  // uploadTaskAttachment controller
);

// Bulk task operations with enhanced validation
router.route("/bulk").patch(
  ...createValidationLayer({
    schema: z.object({
      body: z.object({
        taskIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid task ID format")).min(1, "At least one task ID is required").max(50, "Maximum 50 tasks allowed"),
        operation: z.enum(['delete', 'update_status', 'update_priority', 'assign'], {
          errorMap: () => ({ message: "Operation must be one of: delete, update_status, update_priority, assign" })
        }),
        data: z.object({
          status: z.enum(AvailableTaskStatuses).optional(),
          priority: z.enum(AvailableTaskPriorities).optional(),
          assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format").optional(),
        }).optional()
      }),
      params: z.object({
        projectId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid project ID format")
      })
    }),
    sanitize: true
  }),
  // bulkUpdateTasks controller
);

export default router;