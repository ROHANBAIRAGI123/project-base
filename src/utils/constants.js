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