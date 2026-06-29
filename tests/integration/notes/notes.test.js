import request from "supertest";
import app from "../../../src/app.js";
import User from "../../../src/models/user.model.js";
import { Project } from "../../../src/models/project.model.js";
import { ProjectMember } from "../../../src/models/projectMember.model.js";
import { Note } from "../../../src/models/note.model.js";
import {
  NotesStatusEnum,
  UserRolesEnum,
} from "../../../src/utils/constants.js";
import mongoose from "mongoose";

// Notes are mounted at: /api/v1/:projectId/notes
// Full paths:
//   GET    /api/v1/:projectId/notes/                  → getNotes
//   POST   /api/v1/:projectId/notes/                  → createNote
//   GET    /api/v1/:projectId/notes/note/:noteId      → getNoteById
//   PUT    /api/v1/:projectId/notes/note/:noteId      → updateNote
//   DELETE /api/v1/:projectId/notes/note/:noteId      → deleteNote
//   PATCH  /api/v1/:projectId/notes/note/:noteId/status → changeNoteStatus
//
// KEY OWNERSHIP RULE: Any project member can CREATE notes.
// But only the NOTE OWNER can update, delete, or change status.
// This is different from tasks — it's enforced in the controller, not RBAC middleware.
//
// Note visibility:
//   PERSONAL → only visible to the note owner
//   SHARED   → visible to all project members

// JWT secrets are required by user.model.js#generateAccessToken and the
// verifyJWT middleware. The repo does not commit a .env, so seed them here
// to keep these tests self-contained and deterministic.
beforeAll(() => {
  process.env.ACCESS_TOKEN_SECRET =
    process.env.ACCESS_TOKEN_SECRET || "test-access-secret";
  process.env.ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "1h";
  process.env.REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET || "test-refresh-secret";
  process.env.REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";
});

async function createTestUser({
  username = "noteuser",
  email = "noteuser@example.com",
  fullname = "Note User",
} = {}) {
  const user = await User.create({
    username,
    email,
    password: "Password123!",
    fullname,
    isEmailVerified: true,
  });
  const token = user.generateAccessToken();
  return { user, token };
}

async function createTestProject(ownerId, role = UserRolesEnum.ADMIN) {
  const project = await Project.create({
    name: "test project",
    description: "project created for note integration tests",
    createdBy: ownerId,
  });
  await ProjectMember.create({
    project: project._id,
    user: ownerId,
    role,
  });
  return project;
}

async function addProjectMember(projectId, userId, role) {
  return ProjectMember.create({ project: projectId, user: userId, role });
}

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

describe("POST /api/v1/:projectId/ — Create Note", () => {
  test("should return 201 when any project member (Admin) creates a note", async () => {
    const { user, token } = await createTestUser();
    const project = await createTestProject(user._id, UserRolesEnum.ADMIN);

    const res = await request(app)
      .post(`/api/v1/${project._id}/notes/`)
      .set(authHeader(token))
      .send({ title: "Admin Note", content: "Hello from admin" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: "admin note",
      content: "hello from admin",
      status: NotesStatusEnum.PERSONAL,
    });
    expect(res.body.data.user).toBe(user._id.toString());
    expect(res.body.data.project).toBe(project._id.toString());
  });

  test("should return 201 when a Project Admin creates a note", async () => {
    const { user: owner } = await createTestUser({
      username: "ownerpa",
      email: "ownerpa@example.com",
    });
    const project = await createTestProject(owner._id, UserRolesEnum.ADMIN);

    const { user: projectAdmin, token } = await createTestUser({
      username: "projadmin",
      email: "projadmin@example.com",
    });
    await addProjectMember(
      project._id,
      projectAdmin._id,
      UserRolesEnum.PROJECT_ADMIN,
    );

    const res = await request(app)
      .post(`/api/v1/${project._id}/notes/`)
      .set(authHeader(token))
      .send({ title: "PA Note", content: "From project admin" });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toBe(projectAdmin._id.toString());
  });

  test("should return 201 when a Member creates a note", async () => {
    const { user: owner } = await createTestUser({
      username: "ownerm",
      email: "ownerm@example.com",
    });
    const project = await createTestProject(owner._id, UserRolesEnum.ADMIN);

    const { user: member, token } = await createTestUser({
      username: "memberu",
      email: "memberu@example.com",
    });
    await addProjectMember(project._id, member._id, UserRolesEnum.MEMBER);

    const res = await request(app)
      .post(`/api/v1/${project._id}/notes/`)
      .set(authHeader(token))
      .send({ title: "Member Note", content: "From member" });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toBe(member._id.toString());
  });

  test("should return 401 when request is made without authentication", async () => {
    const { user } = await createTestUser();
    const project = await createTestProject(user._id);

    const res = await request(app)
      .post(`/api/v1/${project._id}/notes/`)
      .send({ title: "Anon Note", content: "no auth" });

    expect(res.status).toBe(401);
  });

  test("should return 403 when user is not a member of the project", async () => {
    const { user: owner } = await createTestUser({
      username: "ownernm",
      email: "ownernm@example.com",
    });
    const project = await createTestProject(owner._id);

    const { token: outsiderToken } = await createTestUser({
      username: "outsider",
      email: "outsider@example.com",
    });

    const res = await request(app)
      .post(`/api/v1/${project._id}/notes/`)
      .set(authHeader(outsiderToken))
      .send({ title: "Sneaky", content: "should be blocked" });

    expect(res.status).toBe(403);
  });

  test("should default note status to PERSONAL when status is not provided", async () => {
    const { user, token } = await createTestUser();
    const project = await createTestProject(user._id);

    const res = await request(app)
      .post(`/api/v1/${project._id}/notes/`)
      .set(authHeader(token))
      .send({ title: "Defaults", content: "no status field" });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe(NotesStatusEnum.PERSONAL);
  });

  test("should return 400 when title is missing", async () => {
    const { user, token } = await createTestUser();
    const project = await createTestProject(user._id);

    const res = await request(app)
      .post(`/api/v1/${project._id}/notes/`)
      .set(authHeader(token))
      .send({ content: "missing title" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/:projectId/ — Get Notes", () => {
  test("should return 200 and include SHARED notes for all project members", async () => {
    const { user: owner, token: ownerToken } = await createTestUser({
      username: "ownerlist",
      email: "ownerlist@example.com",
    });
    const project = await createTestProject(owner._id);

    const { user: member, token: memberToken } = await createTestUser({
      username: "listmember",
      email: "listmember@example.com",
    });
    await addProjectMember(project._id, member._id, UserRolesEnum.MEMBER);

    await Note.create({
      title: "shared one",
      content: "visible to all",
      project: project._id,
      user: owner._id,
      status: NotesStatusEnum.SHARED,
    });

    const ownerRes = await request(app)
      .get(`/api/v1/${project._id}/notes/`)
      .set(authHeader(ownerToken));
    const memberRes = await request(app)
      .get(`/api/v1/${project._id}/notes/`)
      .set(authHeader(memberToken));

    expect(ownerRes.status).toBe(200);
    expect(memberRes.status).toBe(200);
    expect(ownerRes.body.data).toHaveLength(1);
    expect(memberRes.body.data).toHaveLength(1);
    expect(memberRes.body.data[0].title).toBe("shared one");
  });

  test("should return PERSONAL notes only to the note owner, not other members", async () => {
    const { user: owner, token: ownerToken } = await createTestUser({
      username: "ownerpers",
      email: "ownerpers@example.com",
    });
    const project = await createTestProject(owner._id);

    const { user: member, token: memberToken } = await createTestUser({
      username: "persmember",
      email: "persmember@example.com",
    });
    await addProjectMember(project._id, member._id, UserRolesEnum.MEMBER);

    await Note.create({
      title: "private one",
      content: "only owner",
      project: project._id,
      user: owner._id,
      status: NotesStatusEnum.PERSONAL,
    });

    const ownerRes = await request(app)
      .get(`/api/v1/${project._id}/notes/`)
      .set(authHeader(ownerToken));
    const memberRes = await request(app)
      .get(`/api/v1/${project._id}/notes/`)
      .set(authHeader(memberToken));

    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.data).toHaveLength(1);
    expect(memberRes.status).toBe(200);
    expect(memberRes.body.data).toHaveLength(0);
  });

  test("should return 401 when request is made without authentication", async () => {
    const { user } = await createTestUser();
    const project = await createTestProject(user._id);

    const res = await request(app).get(`/api/v1/${project._id}/notes/`);
    expect(res.status).toBe(401);
  });

  test("should return 403 when user is not a member of the project", async () => {
    const { user: owner } = await createTestUser({
      username: "ownergetnm",
      email: "ownergetnm@example.com",
    });
    const project = await createTestProject(owner._id);

    const { token: outsiderToken } = await createTestUser({
      username: "outsiderget",
      email: "outsiderget@example.com",
    });

    const res = await request(app)
      .get(`/api/v1/${project._id}/notes/`)
      .set(authHeader(outsiderToken));
    expect(res.status).toBe(403);
  });
});

describe("GET /api/v1/:projectId/note/:noteId — Get Note By ID", () => {
  test("should return 200 when owner fetches their own PERSONAL note", async () => {
    const { user: owner, token } = await createTestUser();
    const project = await createTestProject(owner._id);
    const note = await Note.create({
      title: "owner private",
      content: "secret",
      project: project._id,
      user: owner._id,
      status: NotesStatusEnum.PERSONAL,
    });

    const res = await request(app)
      .get(`/api/v1/${project._id}/notes/note/${note._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(note._id.toString());
  });

  test("should return 200 when any member fetches a SHARED note", async () => {
    const { user: owner } = await createTestUser({
      username: "ownerby",
      email: "ownerby@example.com",
    });
    const project = await createTestProject(owner._id);

    const { user: member, token: memberToken } = await createTestUser({
      username: "memberby",
      email: "memberby@example.com",
    });
    await addProjectMember(project._id, member._id, UserRolesEnum.MEMBER);

    const note = await Note.create({
      title: "team note",
      content: "shared content",
      project: project._id,
      user: owner._id,
      status: NotesStatusEnum.SHARED,
    });

    const res = await request(app)
      .get(`/api/v1/${project._id}/notes/note/${note._id}`)
      .set(authHeader(memberToken));

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(note._id.toString());
  });

  test("should return 404 when a non-owner tries to fetch someone else's PERSONAL note", async () => {
    const { user: owner } = await createTestUser({
      username: "ownerbynp",
      email: "ownerbynp@example.com",
    });
    const project = await createTestProject(owner._id);

    const { user: member, token: memberToken } = await createTestUser({
      username: "memberbynp",
      email: "memberbynp@example.com",
    });
    await addProjectMember(project._id, member._id, UserRolesEnum.MEMBER);

    const note = await Note.create({
      title: "private",
      content: "not for you",
      project: project._id,
      user: owner._id,
      status: NotesStatusEnum.PERSONAL,
    });

    const res = await request(app)
      .get(`/api/v1/${project._id}/notes/note/${note._id}`)
      .set(authHeader(memberToken));

    expect(res.status).toBe(404);
  });

  test("should return 404 when noteId does not exist", async () => {
    const { user, token } = await createTestUser();
    const project = await createTestProject(user._id);
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .get(`/api/v1/${project._id}/notes/note/${missingId}`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/v1/:projectId/note/:noteId — Update Note", () => {
  test("should return 200 when the note owner updates title or content", async () => {
    const { user: owner, token } = await createTestUser();
    const project = await createTestProject(owner._id);
    const note = await Note.create({
      title: "before",
      content: "before content",
      project: project._id,
      user: owner._id,
      status: NotesStatusEnum.PERSONAL,
    });

    const res = await request(app)
      .put(`/api/v1/${project._id}/notes/note/${note._id}`)
      .set(authHeader(token))
      .send({ title: "after", content: "after content" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("after");
    expect(res.body.data.content).toBe("after content");
  });

  test("should return 403 when a different project member tries to update someone else's note", async () => {
    const { user: owner } = await createTestUser({
      username: "ownerupd",
      email: "ownerupd@example.com",
    });
    const project = await createTestProject(owner._id);

    const { user: member, token: memberToken } = await createTestUser({
      username: "memberupd",
      email: "memberupd@example.com",
    });
    await addProjectMember(project._id, member._id, UserRolesEnum.MEMBER);

    const note = await Note.create({
      title: "owners note",
      content: "owners content",
      project: project._id,
      user: owner._id,
      status: NotesStatusEnum.SHARED,
    });

    const res = await request(app)
      .put(`/api/v1/${project._id}/notes/note/${note._id}`)
      .set(authHeader(memberToken))
      .send({ title: "hacked" });

    expect(res.status).toBe(403);
  });

  test("should return 401 when request is made without authentication", async () => {
    const { user: owner } = await createTestUser();
    const project = await createTestProject(owner._id);
    const note = await Note.create({
      title: "noauth",
      content: "no auth content",
      project: project._id,
      user: owner._id,
    });

    const res = await request(app)
      .put(`/api/v1/${project._id}/notes/note/${note._id}`)
      .send({ title: "should fail" });

    expect(res.status).toBe(401);
  });

  test("should return 404 when noteId does not exist", async () => {
    const { user, token } = await createTestUser();
    const project = await createTestProject(user._id);
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .put(`/api/v1/${project._id}/notes/note/${missingId}`)
      .set(authHeader(token))
      .send({ title: "anything" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/v1/:projectId/note/:noteId — Delete Note", () => {
  test("should return 200 when the note owner deletes their note", async () => {
    const { user: owner, token } = await createTestUser();
    const project = await createTestProject(owner._id);
    const note = await Note.create({
      title: "todelete",
      content: "to be deleted",
      project: project._id,
      user: owner._id,
    });

    const res = await request(app)
      .delete(`/api/v1/${project._id}/notes/note/${note._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    const found = await Note.findById(note._id);
    expect(found).toBeNull();
  });

  test("should return 403 when a different project member tries to delete someone else's note", async () => {
    const { user: owner } = await createTestUser({
      username: "ownerdel",
      email: "ownerdel@example.com",
    });
    const project = await createTestProject(owner._id);

    const { user: member, token: memberToken } = await createTestUser({
      username: "memberdel",
      email: "memberdel@example.com",
    });
    await addProjectMember(project._id, member._id, UserRolesEnum.MEMBER);

    const note = await Note.create({
      title: "owned note",
      content: "owned content",
      project: project._id,
      user: owner._id,
      status: NotesStatusEnum.SHARED,
    });

    const res = await request(app)
      .delete(`/api/v1/${project._id}/notes/note/${note._id}`)
      .set(authHeader(memberToken));

    expect(res.status).toBe(403);
    const stillThere = await Note.findById(note._id);
    expect(stillThere).not.toBeNull();
  });

  test("should return 401 when request is made without authentication", async () => {
    const { user: owner } = await createTestUser();
    const project = await createTestProject(owner._id);
    const note = await Note.create({
      title: "no auth delete",
      content: "no auth delete",
      project: project._id,
      user: owner._id,
    });

    const res = await request(app).delete(
      `/api/v1/${project._id}/notes/note/${note._id}`,
    );
    expect(res.status).toBe(401);
  });

  test("should return 404 when noteId does not exist", async () => {
    const { user, token } = await createTestUser();
    const project = await createTestProject(user._id);
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .delete(`/api/v1/${project._id}/notes/note/${missingId}`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/v1/:projectId/note/:noteId/status — Change Note Status", () => {
  test("should return 200 when owner changes status from PERSONAL to SHARED", async () => {
    const { user: owner, token } = await createTestUser();
    const project = await createTestProject(owner._id);
    const note = await Note.create({
      title: "switchme",
      content: "personal to shared",
      project: project._id,
      user: owner._id,
      status: NotesStatusEnum.PERSONAL,
    });

    const res = await request(app)
      .patch(`/api/v1/${project._id}/notes/note/${note._id}/status`)
      .set(authHeader(token))
      .send({ status: NotesStatusEnum.SHARED });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(NotesStatusEnum.SHARED);
  });

  test("should return 200 when owner changes status from SHARED to PERSONAL", async () => {
    const { user: owner, token } = await createTestUser();
    const project = await createTestProject(owner._id);
    const note = await Note.create({
      title: "switchme back",
      content: "shared to personal",
      project: project._id,
      user: owner._id,
      status: NotesStatusEnum.SHARED,
    });

    const res = await request(app)
      .patch(`/api/v1/${project._id}/notes/note/${note._id}/status`)
      .set(authHeader(token))
      .send({ status: NotesStatusEnum.PERSONAL });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(NotesStatusEnum.PERSONAL);
  });

  test("should return 400 when owner tries to set the same status that is already set", async () => {
    const { user: owner, token } = await createTestUser();
    const project = await createTestProject(owner._id);
    const note = await Note.create({
      title: "samestatus",
      content: "same status",
      project: project._id,
      user: owner._id,
      status: NotesStatusEnum.PERSONAL,
    });

    const res = await request(app)
      .patch(`/api/v1/${project._id}/notes/note/${note._id}/status`)
      .set(authHeader(token))
      .send({ status: NotesStatusEnum.PERSONAL });

    expect(res.status).toBe(400);
  });

  test("should return 403 when a non-owner tries to change the note status", async () => {
    const { user: owner } = await createTestUser({
      username: "ownerst",
      email: "ownerst@example.com",
    });
    const project = await createTestProject(owner._id);

    const { user: member, token: memberToken } = await createTestUser({
      username: "memberst",
      email: "memberst@example.com",
    });
    await addProjectMember(project._id, member._id, UserRolesEnum.MEMBER);

    const note = await Note.create({
      title: "owned note",
      content: "owned content",
      project: project._id,
      user: owner._id,
      status: NotesStatusEnum.PERSONAL,
    });

    const res = await request(app)
      .patch(`/api/v1/${project._id}/notes/note/${note._id}/status`)
      .set(authHeader(memberToken))
      .send({ status: NotesStatusEnum.SHARED });

    expect(res.status).toBe(403);
  });

  test("should return 400 when status value is not one of: personal, shared", async () => {
    const { user: owner, token } = await createTestUser();
    const project = await createTestProject(owner._id);
    const note = await Note.create({
      title: "badstatus",
      content: "bad status",
      project: project._id,
      user: owner._id,
      status: NotesStatusEnum.PERSONAL,
    });

    const res = await request(app)
      .patch(`/api/v1/${project._id}/notes/note/${note._id}/status`)
      .set(authHeader(token))
      .send({ status: "archived" });

    expect(res.status).toBe(400);
  });
});
