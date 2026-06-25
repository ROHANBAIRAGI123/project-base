import request from "supertest";
import app from "../../../src/app.js";

describe("PUT /api/v1/projects/:projectId", () => {
  test.todo(
    "should return 200 when an Admin updates project name or description",
  );

  test.todo(
    "should return 403 when a Project Admin tries to update the project",
  );

  test.todo("should return 403 when a Member tries to update the project");

  test.todo("should return 401 when request is made without authentication");

  test.todo("should return 404 when projectId does not exist");

  test.todo("should return 400 when update body is empty or invalid");
});
