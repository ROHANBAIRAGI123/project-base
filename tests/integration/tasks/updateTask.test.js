import request from "supertest";
import app from "../../../src/app.js";

describe("PUT /api/v1/:projectId/tasks/:taskId — Update Task", () => {
  test.todo("should return 200 when Admin updates a task");

  test.todo("should return 200 when Project Admin updates a task");

  test.todo("should return 403 when a Member tries to update the task");

  test.todo("should return 401 when request is made without authentication");

  test.todo("should return 404 when taskId does not exist in this project");

  test.todo(
    "should update task status from todo → in_progress → done correctly",
  );

  test.todo(
    "should return 400 when status value is not one of: todo, in_progress, done",
  );
});

describe("DELETE /api/v1/:projectId/tasks/:taskId — Delete Task", () => {
  test.todo("should return 200 when Admin deletes a task");

  test.todo("should return 200 when Project Admin deletes a task");

  test.todo("should return 403 when a Member tries to delete a task");

  test.todo("should cascade-delete all subtasks when the task is deleted");
});
