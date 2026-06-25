import request from "supertest";
import app from "../../../src/app.js";

// Task routes: POST /api/v1/:projectId/tasks (check your actual route in task.routes.js)
// Roles that can create tasks: Admin, Project Admin
// Members CANNOT create tasks

describe("POST /api/v1/:projectId/tasks — Create Task", () => {
  test.todo("should return 201 when Admin creates a task in their project");

  test.todo("should return 201 when Project Admin creates a task");

  test.todo("should return 403 when a Member tries to create a task");

  test.todo("should return 401 when request is made without authentication");

  test.todo("should return 400 when task title is missing");

  test.todo(
    "should return 400 when assigned user is not a member of the project",
  );

  test.todo(
    "should return 400 when task title contains XSS payload (sanitization check)",
  );

  test.todo(
    "should return 400 when task priority is not one of the valid enum values",
  );
});

describe("GET /api/v1/:projectId/tasks — List Tasks", () => {
  test.todo("should return 200 and an array of tasks for a project member");

  test.todo("should return 401 for unauthenticated request");

  test.todo("should return 403 when user is not a member of the project");
});
