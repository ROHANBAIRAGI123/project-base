import request from "supertest";
import app from "../../../src/app.js";

// GET /api/v1/:projectId/task/:taskId  —  getTaskDetails
// All project members can fetch a task's details.

describe("GET /api/v1/:projectId/task/:taskId — Get Task Details", () => {
  it.todo("should return 200 with task details for any project member (Admin)");

  it.todo("should return 200 with task details for a project Member");

  it.todo("should return 403 when the requesting user is not a project member");

  it.todo("should return 401 when request is made without authentication");

  it.todo("should return 400 when taskId is not a valid MongoDB ObjectId");

  it.todo("should return 404 when taskId does not exist within the project");
});

// GET /api/v1/:projectId/task/:taskId/subtasks  —  getSubTasks
// All project members can list subtasks.

describe("GET /api/v1/:projectId/task/:taskId/subtasks — List Subtasks", () => {
  it.todo("should return 200 and an array of subtasks for any project member");

  it.todo("should return an empty array when the task has no subtasks");

  it.todo("should return 403 when the user is not a member of the project");

  it.todo("should return 401 when request is made without authentication");

  it.todo("should return 400 when taskId is not a valid MongoDB ObjectId");
});

// GET /api/v1/:projectId/tasks — getTasks (filtering)
// Tests for filtering and pagination query parameters.

describe("GET /api/v1/:projectId/tasks — Task Filtering & Pagination", () => {
  it.todo(
    "should return only tasks matching the provided status filter (e.g., status=todo)",
  );

  it.todo(
    "should return only tasks matching the provided priority filter (e.g., priority=high)",
  );

  it.todo(
    "should return only tasks assigned to a specific userId when assignedTo filter is provided",
  );

  it.todo(
    "should paginate results correctly using page and limit query parameters",
  );

  it.todo(
    "should return 400 when status filter value is not a valid enum value",
  );

  it.todo(
    "should return 400 when priority filter value is not a valid enum value",
  );
});

// PATCH /api/v1/:projectId/task/:taskId/subtask/:subTaskId — updateSubtask
// Members CAN update subtasks (unlike tasks, which restrict writes to Admin/ProjectAdmin).

describe("PATCH /api/v1/:projectId/task/:taskId/subtask/:subTaskId — Update Subtask", () => {
  it.todo("should return 200 when a Member updates a subtask title");

  it.todo("should return 403 when the user is not a member of the project");

  it.todo("should return 401 when request is made without authentication");

  it.todo("should return 404 when subTaskId does not exist");

  it.todo("should return 400 when subTaskId is not a valid MongoDB ObjectId");
});
