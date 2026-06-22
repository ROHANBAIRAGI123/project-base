import { z } from "zod";
import { 
  AvailableUserRole, 
  AvailableTaskStatuses, 
  AvailableTaskPriorities,
  ValidationConstants 
} from "../utils/constants.js";

// Base validation schemas with enhanced security
const emailSchema = z
.string()
.trim()
.min(1, "Email is required")
.max(ValidationConstants.EMAIL_MAX_LENGTH, `Email cannot exceed ${ValidationConstants.EMAIL_MAX_LENGTH} characters`)
.email("Invalid email address")
.toLowerCase()
  .transform((val) => val.replace(/\s+/g, ""))
  .refine((val) => !val.includes('..'), "Email cannot contain consecutive dots")
  .refine((val) => !/[<>'"&]/.test(val), "Email contains invalid characters");

const passwordSchema = z
  .string()
  .min(ValidationConstants.PASSWORD_MIN_LENGTH, `Password must be at least ${ValidationConstants.PASSWORD_MIN_LENGTH} characters long`)
  .max(128, "Password cannot exceed 128 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number")
  .refine((val) => !/\s/.test(val), "Password cannot contain spaces")
  .refine((val) => !/[<>'"&]/.test(val), "Password contains invalid characters");

const strongPasswordSchema = z
  .string()
  .min(ValidationConstants.STRONG_PASSWORD_MIN_LENGTH, `Password must be at least ${ValidationConstants.STRONG_PASSWORD_MIN_LENGTH} characters long`)
  .max(128, "Password cannot exceed 128 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
  )
  .refine((val) => !/\s/.test(val), "Password cannot contain spaces");

const usernameSchema = z
  .string()
  .trim()
  .min(ValidationConstants.USERNAME_MIN_LENGTH, `Username must be at least ${ValidationConstants.USERNAME_MIN_LENGTH} characters long`)
  .max(ValidationConstants.USERNAME_MAX_LENGTH, `Username cannot exceed ${ValidationConstants.USERNAME_MAX_LENGTH} characters`)
  .toLowerCase()
  .regex(/^[a-z0-9_-]+$/, "Username can only contain lowercase letters, numbers, hyphens, and underscores")
  .refine((val) => !val.startsWith('-') && !val.endsWith('-'), "Username cannot start or end with hyphen")
  .refine((val) => !val.startsWith('_') && !val.endsWith('_'), "Username cannot start or end with underscore")
  .refine((val) => !/^(admin|root|api|www|mail|ftp)$/i.test(val), "Username is reserved");

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(ValidationConstants.NAME_MAX_LENGTH, `Name cannot exceed ${ValidationConstants.NAME_MAX_LENGTH} characters`)
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
  .refine((val) => val.length >= 2, "Name must be at least 2 characters long")
  .refine((val) => !/\s{2,}/.test(val), "Name cannot contain multiple consecutive spaces");

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// Enhanced Auth validation schemas
export const userRegisterSchema = z.object({
  body: z.object({
    email: emailSchema,
    username: usernameSchema,
    password: strongPasswordSchema,
    fullname: nameSchema,
    acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions").optional(),
  })
});

export const userLoginSchema = z.object({
  body: z.object({
    email: emailSchema.optional(),
    username: usernameSchema.optional(),
    password: z.string().min(1, "Password is required"),
    rememberMe: z.boolean().optional(),
  }).refine((data) => data.email || data.username, {
    message: "Either email or username is required",
    path: ["email"]
  })
});

export const userChangeCurrentPasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password confirmation does not match",
    path: ["confirmPassword"]
  }).refine((data) => data.oldPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"]
  })
});

export const userForgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  })
});

export const userResetForgotPasswordSchema = z.object({
  body: z.object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password confirmation does not match",
    path: ["confirmPassword"]
  }),
  params: z.object({
    resetToken: z.string().min(1, "Reset token is required"),
  })
});

export const userEmailVerificationSchema = z.object({
  params: z.object({
    verificationToken: z.string().min(1, "Verification token is required"),
  })
});

export const userProfileUpdateSchema = z.object({
  body: z.object({
    fullname: nameSchema.optional(),
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  })
});

// Enhanced Project validation schemas
export const createProjectSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Project name is required")
      .max(ValidationConstants.PROJECT_NAME_MAX_LENGTH, `Project name cannot exceed ${ValidationConstants.PROJECT_NAME_MAX_LENGTH} characters`)
      .regex(/^[a-zA-Z0-9\s\-_]+$/, "Project name can only contain letters, numbers, spaces, hyphens, and underscores")
      .refine((val) => !/^\s|\s$/.test(val), "Project name cannot start or end with spaces"),
    description: z
      .string()
      .trim()
      .max(ValidationConstants.PROJECT_DESCRIPTION_MAX_LENGTH, `Description cannot exceed ${ValidationConstants.PROJECT_DESCRIPTION_MAX_LENGTH} characters`)
      .optional(),
    // isPrivate: z.boolean().default(false),
    // tags: z.array(z.string().trim().min(1).max(20)).max(10, "Maximum 10 tags allowed").optional(),
  })
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Project name is required")
      .max(ValidationConstants.PROJECT_NAME_MAX_LENGTH, `Project name cannot exceed ${ValidationConstants.PROJECT_NAME_MAX_LENGTH} characters`)
      .regex(/^[a-zA-Z0-9\s\-_]+$/, "Project name can only contain letters, numbers, spaces, hyphens, and underscores")
      .optional(),
    description: z
      .string()
      .trim()
      .max(ValidationConstants.PROJECT_DESCRIPTION_MAX_LENGTH, `Description cannot exceed ${ValidationConstants.PROJECT_DESCRIPTION_MAX_LENGTH} characters`)
      .optional(),
    // isPrivate: z.boolean().optional(),
    // tags: z.array(z.string().trim().min(1).max(20)).max(10, "Maximum 10 tags allowed").optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
  params: z.object({
    projectId: mongoIdSchema,
  })
});

export const addMemberToProjectSchema = z.object({
  body: z.object({
    userId: mongoIdSchema,
    role: z.enum(AvailableUserRole, {
      errorMap: () => ({ message: `Role must be one of: ${AvailableUserRole.join(", ")}` })
    }),
    message: z.string().trim().max(200, "Message cannot exceed 200 characters").optional(),
  }),
  params: z.object({
    projectId: mongoIdSchema,
  })
});

export const removeMemberFromProjectSchema = z.object({
  params: z.object({
    projectId: mongoIdSchema,
    memberId: mongoIdSchema,
  })
});

export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(AvailableUserRole, {
      errorMap: () => ({ message: `Role must be one of: ${AvailableUserRole.join(", ")}` })
    }),
  }),
  params: z.object({
    projectId: mongoIdSchema,
    memberId: mongoIdSchema,
  })
});

// Enhanced Task validation schemas
export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, "Task title is required")
      .max(ValidationConstants.TASK_TITLE_MAX_LENGTH, `Task title cannot exceed ${ValidationConstants.TASK_TITLE_MAX_LENGTH} characters`),
    description: z
      .string()
      .trim()
      .max(ValidationConstants.TASK_DESCRIPTION_MAX_LENGTH, `Task description cannot exceed ${ValidationConstants.TASK_DESCRIPTION_MAX_LENGTH} characters`)
      .optional(),
    assignedTo: mongoIdSchema.optional(),
    status: z.enum(AvailableTaskStatuses, {
      errorMap: () => ({ message: `Status must be one of: ${AvailableTaskStatuses.join(", ")}` })
    }).default("todo"),
    priority: z.enum(AvailableTaskPriorities, {
      errorMap: () => ({ message: `Priority must be one of: ${AvailableTaskPriorities.join(", ")}` })
    }).default("medium"),
    dueDate: z.string().datetime("Invalid date format").optional(),
    estimatedHours: z.number().min(0.5, "Estimated hours must be at least 0.5").max(1000, "Estimated hours cannot exceed 1000").optional(),
    tags: z.array(z.string().trim().min(1).max(20)).max(10, "Maximum 10 tags allowed").optional(),
  }),
  params: z.object({
    projectId: mongoIdSchema,
  })
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, "Task title is required")
      .max(ValidationConstants.TASK_TITLE_MAX_LENGTH, `Task title cannot exceed ${ValidationConstants.TASK_TITLE_MAX_LENGTH} characters`)
      .optional(),
    description: z
      .string()
      .trim()
      .max(ValidationConstants.TASK_DESCRIPTION_MAX_LENGTH, `Task description cannot exceed ${ValidationConstants.TASK_DESCRIPTION_MAX_LENGTH} characters`)
      .optional(),
    assignedTo: mongoIdSchema.optional(),
    status: z.enum(AvailableTaskStatuses, {
      errorMap: () => ({ message: `Status must be one of: ${AvailableTaskStatuses.join(", ")}` })
    }).optional(),
    priority: z.enum(AvailableTaskPriorities, {
      errorMap: () => ({ message: `Priority must be one of: ${AvailableTaskPriorities.join(", ")}` })
    }).optional(),
    dueDate: z.string().datetime("Invalid date format").optional(),
    estimatedHours: z.number().min(0.5, "Estimated hours must be at least 0.5").max(1000, "Estimated hours cannot exceed 1000").optional(),
    actualHours: z.number().min(0, "Actual hours cannot be negative").max(1000, "Actual hours cannot exceed 1000").optional(),
    tags: z.array(z.string().trim().min(1).max(20)).max(10, "Maximum 10 tags allowed").optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
  params: z.object({
    projectId: mongoIdSchema,
    taskId: mongoIdSchema,
  })
});

export const deleteTaskSchema = z.object({
  params: z.object({
    projectId: mongoIdSchema,
    taskId: mongoIdSchema,
  })
});

// Common parameter and query schemas
export const mongoIdParamSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  })
});

export const paginationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, "Page must be a positive number")
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, "Page must be greater than 0")
      .default("1"),
    limit: z
      .string()
      .regex(/^\d+$/, "Limit must be a positive number")
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= ValidationConstants.PAGINATION_MAX_LIMIT, `Limit must be between 1 and ${ValidationConstants.PAGINATION_MAX_LIMIT}`)
      .default(ValidationConstants.PAGINATION_DEFAULT_LIMIT.toString()),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().trim().max(100, "Search query cannot exceed 100 characters").optional(),
  }).optional()
});

export const taskFilterSchema = z.object({
  query: z.object({
    status: z.enum(AvailableTaskStatuses).optional(),
    priority: z.enum(AvailableTaskPriorities).optional(),
    assignedTo: mongoIdSchema.optional(),
    dueDateFrom: z.string().datetime().optional(),
    dueDateTo: z.string().datetime().optional(),
    ...paginationSchema.shape.query.shape,
  }).optional()
});

// File upload validation schema
export const fileUploadSchema = z.object({
  files: z.object({
    file: z.any().refine((file) => {
      return file && file.size <= ValidationConstants.MAX_FILE_SIZE;
    }, `File size cannot exceed ${ValidationConstants.MAX_FILE_SIZE / (1024 * 1024)}MB`)
  }).optional()
});

export const deleteUserSchema = z.object({
  body: z.object({
    password: z.string().min(1, "Password is required"),
  })
});

export const refreshAccessTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
  headers: z.object({
    authorization: z.string().optional(),
  }).passthrough()
}).refine((data) => {
  return data.cookies?.refreshToken || data.headers?.authorization;
}, {
  message: "Refresh token is required in cookies or authorization header",
  path: ["cookies.refreshToken"]
});

// Legacy function exports for backward compatibility (to be removed in future versions)
export const userRegisterValidator = () => userRegisterSchema;
export const userLoginValidator = () => userLoginSchema;
export const userChangeCurrentPasswordValidator = () => userChangeCurrentPasswordSchema;
export const userForgotPasswordValidator = () => userForgotPasswordSchema;
export const userResetForgotPasswordValidator = () => userResetForgotPasswordSchema;
export const createProjectValidator = () => createProjectSchema;
export const addMembertoProjectValidator = () => addMemberToProjectSchema;

/*
 * ===========================================================================================
 *                              NOTES — index.js (Validators)
 * ===========================================================================================
 *
 * PURPOSE: Defines all Zod validation schemas for incoming HTTP request payloads (body, query, params).
 * ROLE IN ARCHITECTURE: Request Validation Layer. Acts as the first line of defense, ensuring that malformed or malicious data never reaches the controllers or database.
 * 
 * IMPORTS:
 * - `z` (Zod): TypeScript-first schema declaration and validation library.
 * - `constants.js`: Provides enumerations and application limits (like max lengths) to keep validations in sync with business logic.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - Base Schemas (`emailSchema`, `passwordSchema`, `usernameSchema`): Reusable primitives that enforce strict security rules (e.g., blocking dots, spaces, SQL injection characters).
 * - Auth Schemas (`userRegisterSchema`, `userLoginSchema`): Validate registration/login payloads. Login uses `.refine` to ensure either email or username is provided.
 * - Project/Task Schemas (`createProjectSchema`, `createTaskSchema`): Validate domain entities, ensuring required fields, valid dates, and preventing extremely long strings.
 * - Pagination Schemas: Ensure page and limit are positive integers within allowed bounds.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Used by `src/middlewares/validation.middleware.js` or directly in route definitions to validate requests.
 * - Outbound dependencies: Relies heavily on `constants.js`.
 * 
 * DESIGN PATTERNS:
 * - Schema-Based Validation: Decouples validation logic from business logic (controllers), making both easier to test and maintain.
 * - Composition: Base schemas (like `mongoIdSchema`) are reused across complex object schemas, reducing duplication.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why use Zod over Joi or Yup?
 *    Answer: Zod is highly integrated with TypeScript (if TS is added later), has a very expressive API, and handles complex validations (like `.refine()`) cleanly.
 * 2. What is the purpose of `.transform((val) => val.replace(/\s+/g, ""))` on the email schema?
 *    Answer: It sanitizes the input by removing accidental spaces before the data is processed, preventing failed lookups or validation errors caused by copy-paste errors.
 * 3. Why validate max lengths when MongoDB has no strict size limit for strings?
 *    Answer: To prevent DoS attacks where a malicious user sends a multi-megabyte string, exhausting server memory or database storage.
 */
