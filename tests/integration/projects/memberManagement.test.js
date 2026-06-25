import request from "supertest";
import app from "../../../src/app.js";

describe("POST /api/v1/projects/:projectId/members — Add Member", () => {
  test.todo("should return 201 when Admin invites a user by email");

  test.todo("should return 403 when a Project Admin tries to add a member");

  test.todo("should return 403 when a Member tries to add someone");

  test.todo(
    "should return 400 when the invited email does not exist in the system",
  );

  test.todo(
    "should return 409 when the user is already a member of the project",
  );
});

describe("PUT /api/v1/projects/:projectId/members/:userId — Update Role", () => {
  test.todo(
    "should return 200 when Admin changes a member role to project_admin",
  );

  test.todo("should return 403 when a Project Admin tries to change roles");

  test.todo(
    "should return 400 when role value is not one of: admin, project_admin, member",
  );
});

describe("DELETE /api/v1/projects/:projectId/members/:userId — Remove Member", () => {
  test.todo("should return 200 when Admin removes a member from the project");

  test.todo("should return 403 when a non-Admin tries to remove a member");

  test.todo(
    "should return 400 when Admin tries to remove themselves (last admin guard)",
  );
});
