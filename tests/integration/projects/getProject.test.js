import request from "supertest";
import app from "../../../src/app.js";

// GET /api/v1/projects/:projectId  —  getProjectById
// Accessible to all project members (ADMIN, PROJECT_ADMIN, MEMBER).

describe("GET /api/v1/projects/:projectId — Get Project By ID", () => {
  it.todo(
    "should return 200 with project details when an Admin fetches their project",
  );

  it.todo(
    "should return 200 with project details when a Member fetches a project they belong to",
  );

  it.todo(
    "should return 403 when an authenticated user who is not a project member tries to fetch the project",
  );

  it.todo("should return 401 when request is made without authentication");

  it.todo(
    "should return 400 when projectId is not a valid MongoDB ObjectId format",
  );

  it.todo(
    "should return 404 when the projectId does not exist in the database",
  );
});

// GET /api/v1/projects/:projectId/members  —  getProjectMembers
// Accessible to all project members.

describe("GET /api/v1/projects/:projectId/members — Get Project Members", () => {
  it.todo("should return 200 and list all members when an Admin requests");

  it.todo("should return 200 and list all members when a Member requests");

  it.todo(
    "should return 403 when an authenticated user is not a member of the project",
  );

  it.todo("should return 401 when request is made without authentication");

  it.todo("should include role information for each member in the response");
});

// PATCH /api/v1/projects/:projectId/members/:userId  —  updateMemberRole
// Restricted to ADMIN and PROJECT_ADMIN.

describe("PATCH /api/v1/projects/:projectId/members/:userId — Update Member Role", () => {
  it.todo("should return 200 when Admin promotes a Member to PROJECT_ADMIN");

  it.todo("should return 200 when Admin demotes a PROJECT_ADMIN to MEMBER");

  it.todo(
    "should return 403 when a Member tries to change another member's role",
  );

  it.todo("should return 401 when request is made without authentication");

  it.todo(
    "should return 400 when the role value is not one of the valid enum values",
  );

  it.todo(
    "should return 400 when Admin tries to change their own role (self-demotion guard)",
  );

  it.todo(
    "should return 404 when the target userId is not a member of the project",
  );
});
