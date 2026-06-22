# TODO: Project Camp Backend

> **Current State:** ~50% complete. The server **cannot start** in its current state. Critical bugs must be resolved before any feature work.
>
> **Audit Source:** [technical_state_audit.md](technical_state_audit.md)

---

## 🔴 P0 — Critical (Server is Broken / Security Risk)

These must be fixed before the server can run at all, or before any endpoint is trusted.



### 2. Fix RBAC Param Mismatch — `GET /` Project Listing Returns 403
**File:** [project.routes.js](../src/routers/project.routes.js)

The root `GET /` route (list all projects) incorrectly mounts `checkProjectPermission`. There is no `:projectId` in this path, so `req.params.projectId` is `undefined`, causing every logged-in user to receive a 403 Forbidden when listing their projects. Remove or replace the permission middleware on this route.

### 3. Fix RBAC Param Mismatch — Resend & Cancel Invitation Returns 403
**File:** [projectInvite.routes.js](../src/routers/projectInvite.routes.js)

The `/resend` and `/cancel` routes use `:invitationId` as a URL param, but `checkProjectPermission` reads `:projectId`. The middleware always gets `undefined`, blocking admins from managing invitations.

### 4. Remove Cleartext Credential Logging
**File:** [app.js](../src/app.js)

The global debug middleware logs the full `req.body` to stdout for every request. For `/register`, `/login`, `/change-password`, and `/delete-user`, this dumps plaintext passwords into application logs. Either remove the middleware entirely or gate it behind `NODE_ENV === 'test'` only.

---

## 🟠 P1 — High Priority (Missing Validation / Security Gaps)

### 5. Add Zod Validation for `POST /refresh-access-token`
**File:** [auth.routes.js](../src/routers/auth.routes.js)

No input schema is mounted on this route — the controller receives raw, unvalidated input.

### 6. Add Zod Validation for `POST /delete-user`
**File:** [auth.routes.js](../src/routers/auth.routes.js)

Takes `email` + `password` in the body with no Zod schema guard.

### 7. Add Rate Limiting on Auth Routes
**Package:** `express-rate-limit` (not installed)

No rate limiter exists on `/login`, `/register`, or `/reset-password`. This exposes the API to brute-force attacks. Install and configure `express-rate-limit` globally or on sensitive auth routes.

---

## 🟡 P2 — Medium Priority (Missing Features / Core Logic)

### 8. Implement Notes Module (Controllers + Routes)
**Files:** [note.controllers.js](../src/controllers/note.controllers.js), [note.routes.js](../src/routers/note.routes.js), [app.js](../src/app.js)

The Note model ([note.model.js](../src/models/note.model.js)) is complete. Everything else is a stub or commented out.

- Implement controller functions: `getNotes`, `createNote`, `getNoteById`, `updateNote`, `deleteNote`
- Wire routes with correct `verifyJWT` + `checkProjectPermission` guards:
  - `GET /:projectId` — any member
  - `POST /:projectId` — Admin only
  - `GET /:projectId/n/:noteId` — any member
  - `PUT /:projectId/n/:noteId` — Admin only
  - `DELETE /:projectId/n/:noteId` — Admin only
- Mount note router in `app.js` at `/api/v1/notes`
- Add Zod validation schemas for note create/update in [validators/index.js](../src/validators/index.js)

### 9. Implement Task File Attachments
**Files:** [task.routes.js](../src/routers/task.routes.js), [task.controllers.js](../src/controllers/task.controllers.js)

The attachment routes are placeholder comments. `multer` is not installed. The `attachments` field is missing from the Task model.

- Install `multer`
- Add `attachments` field to Task model ([task.model.js](../src/models/task.model.js)) along with `dueDate`, `estimatedHours`, `actualHours`, `tags`, `createdBy`
- Implement attachment upload/delete controller logic
- Wire routes with `multer` middleware

### 10. Add Note Deletion to `deleteProject` Controller
**File:** [project.controllers.js](../src/controllers/project.controllers.js)

When a project is deleted, its associated notes are not cleaned up, leaving orphaned documents in the Notes collection.

### 11. Add User Profile Fields to User Model
**File:** [user.model.js](../src/models/user.model.js)

The schema accepts `bio`, `location`, and `website` but the Mongoose model does not persist them.

### 12. Add Database Indexes
**Files:** [task.model.js](../src/models/task.model.js), [projectMember.model.js](../src/models/projectMember.model.js)

No compound indexes exist for critical query paths:
- `Task`: `(project, status)` and `(project, assignedTo)`
- `ProjectMember`: `(project, user, role)`

---

## 🔵 P3 — Low Priority (Consistency / Tech Debt)

### 13. Fix HTTP Method Inconsistencies (PATCH → PUT)
PRD specifies `PUT` for update operations. Code uses `PATCH` throughout:
- `POST /change-password` → currently `PATCH` ([auth.routes.js](../src/routers/auth.routes.js))
- `PUT /:projectId` → currently `PATCH` ([project.routes.js](../src/routers/project.routes.js))
- Task update route ([task.routes.js](../src/routers/task.routes.js))

Decide on one convention and apply it consistently.

### 14. Fix Incorrect Status Codes (201 → 200 for non-create operations)
- `loginUser` returns `201` — should be `200` ([auth.controllers.js](../src/controllers/auth.controllers.js))
- Several GET/PATCH/DELETE project operations return `201` ([project.controllers.js](../src/controllers/project.controllers.js))

### 15. Align Route Path Names with PRD
- `/refresh-access-token` → `/refresh-token`
- `/me` → `/current-user`

### 16. Move `nodemon` to `devDependencies`
**File:** [package.json](../package.json)

`nodemon` is listed under `dependencies` — it is a dev-only tool.

### 17. Fix `ApiResponse` Status Code Inconsistency
Some responses pass `200` to the `ApiResponse` constructor but call `res.status(201)` — or vice versa. Audit and align throughout the codebase.

---

## 🏗️ Missing Foundations (Pre-Production Blockers)

These do not block development but must exist before any production deployment.

| # | Task | Rationale |
|---|------|-----------|
| F1 | **Add test infrastructure** (Jest or Vitest) | `npm test` currently crashes. Zero unit, integration, or contract tests exist. |
| F2 | **Replace `console` logs with structured logger** (Winston or Pino) | Enables environment-scoped log levels and prevents sensitive data leakage in production. |
| F3 | **Add Redis caching layer** | Minimize DB lookups for session validation and project configs. |
| F4 | **Set up CI/CD pipeline** | No automated testing or deployment pipeline exists. |

---

## ✅ Verification Checklist

After completing P0 fixes, validate the following before moving to P1/P2:

- [ ] `npm run dev` starts without throwing `TypeError: z.email is not a function`
- [ ] `GET /api/v1/projects` returns project list for authenticated user (not 403)
- [ ] `POST /api/v1/projects/:projectId/invitations/:invitationId/resend` succeeds for Admin (not 403)
- [ ] `POST /api/v1/projects/:projectId/invitations/:invitationId/cancel` succeeds for Admin (not 403)
- [ ] Password does not appear in stdout when calling `/login` or `/register`
- [ ] `GET /api/v1/auth/get-all-users` without token returns 401
- [ ] `DELETE /api/v1/projects/:id` as non-admin member returns 403

---

## 📊 Maturity Scorecard (from Audit)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Product Maturity | 4 / 10 | Notes & Attachments missing; core flows broken |
| Architecture | 7 / 10 | Clean layering, SOLID principles, good normalization |
| Code Quality | 6 / 10 | Readable but compile errors, HTTP inconsistencies |
| Scalability | 5 / 10 | No caching, no indexes |
| Security | 4 / 10 | Credential leakage in logs, broken RBAC |
| Production Readiness | 2 / 10 | Server won't start; no tests, no CI/CD |
