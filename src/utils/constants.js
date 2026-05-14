export const UserRolesEnum = {
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
};

export const AvailableUserRole = Object.values(UserRolesEnum);

export const TaskStatusEnum = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

export const AvailableTaskStatuses = Object.values(TaskStatusEnum);

export const TaskPriorityEnum = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

export const AvailableTaskPriorities = Object.values(TaskPriorityEnum);

// Validation constants
export const ValidationConstants = {
  PASSWORD_MIN_LENGTH: 6,
  STRONG_PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  EMAIL_MAX_LENGTH: 254,
  NAME_MAX_LENGTH: 100,
  PROJECT_NAME_MAX_LENGTH: 100,
  TASK_TITLE_MAX_LENGTH: 200,
  TASK_DESCRIPTION_MAX_LENGTH: 1000,
  PROJECT_DESCRIPTION_MAX_LENGTH: 500,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES_PER_UPLOAD: 5,
  PAGINATION_MAX_LIMIT: 100,
  PAGINATION_DEFAULT_LIMIT: 10,
};

export const options = {
  httpOnly: true,
  secure: true,
};

export const NotesStatusEnum = {
  PERSONAL: "personal",
  SHARED: "shared",
};

/*
 * ===========================================================================================
 *                              NOTES — constants.js
 * ===========================================================================================
 *
 * PURPOSE: Centralizes all system-wide enum values, application limits, and shared configuration options.
 * ROLE IN ARCHITECTURE: Utility module utilized across controllers, models, and validation schemas to ensure consistency and eliminate magic numbers/strings.
 * 
 * IMPORTS:
 * - None (This is a pure data module with zero dependencies).
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - UserRolesEnum / AvailableUserRole: Defines the valid roles for RBAC (Admin, Project Admin, Member). Used heavily in authorization middleware.
 * - TaskStatusEnum / AvailableTaskStatuses: Specifies allowed states for tasks and subtasks (Todo, In Progress, Done).
 * - TaskPriorityEnum / AvailableTaskPriorities: Defines urgency levels for tasks.
 * - ValidationConstants: Single source of truth for max lengths, min lengths, file sizes, and pagination defaults. Keeps DB schemas and validation logic in sync.
 * - options: Shared configuration object for setting secure, HTTP-only cookies in auth flows.
 * - NotesStatusEnum: Specifies visibility levels for notes (Personal vs Shared).
 *
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Imported by virtually every model, controller, and validator in the system.
 * - Outbound dependencies: None.
 * 
 * DESIGN PATTERNS:
 * - Singleton Data Dictionary: Provides a single source of truth for constants to prevent typo-driven bugs.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why extract string constants into Enums/Objects?
 *    Answer: To prevent typos, enable autocomplete, and provide a single place to update values without hunting down magic strings across the codebase.
 * 2. Why use Object.values() alongside the Enum definition?
 *    Answer: It easily extracts the values into an array, which is required by tools like Mongoose (for the `enum` validator) or Zod.
 * 3. Why are cookie options centralized here?
 *    Answer: To ensure auth cookies are consistently configured with `httpOnly` and `secure` flags across login, logout, and token refresh routes.
 */