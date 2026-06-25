# TODO: Project Camp Backend

> **Current State:** P0 bugs fixed, rate limiter implemented. Next step: testing infrastructure.
>
> **Audit Source:** [technical_state_audit.md](technical_state_audit.md)

## ✅ Completed

- [x] Fix `z.email()` → `z.string().email()` Zod syntax crash
- [x] Remove RBAC middleware from `GET /` project listing (403 fix)
- [x] Fix RBAC param mismatch on invitation resend/cancel routes
- [x] Remove cleartext credential logging from debug middleware
- [x] Implement rate limiter (`express-rate-limit`) — two-tier: auth strict + global DoS

---

## 🟠 P1 — High Priority (Missing Validation / Security Gaps)

### 5. Add Zod Validation for `POST /refresh-access-token`

**File:** [auth.routes.js](../src/routers/auth.routes.js)

No input schema is mounted on this route — the controller receives raw, unvalidated input.

### 6. Add Zod Validation for `POST /delete-user`

**File:** [auth.routes.js](../src/routers/auth.routes.js)

Takes `email` + `password` in the body with no Zod schema guard.

---

## 🟡 P2 — Medium Priority (Missing Features / Core Logic)

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

### 17. Fix `ApiResponse` Status Code Inconsistency

Some responses pass `200` to the `ApiResponse` constructor but call `res.status(201)` — or vice versa. Audit and align throughout the codebase.

---

## 🏗️ Missing Foundations (Pre-Production Blockers)

These do not block development but must exist before any production deployment.

| #   | Task                                                                         | Rationale                                                                                                                       |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **Add test infrastructure** — **Vitest + Supertest + MongoDB Memory Server** | `npm test` crashes. Stack chosen: see [design_choices.md](design_choices.md) §Testing.                                          |
| F2  | **Migrate backend to TypeScript**                                            | Frontend will be TS; shared types require it. Migrate after tests pass. See [design_choices.md](design_choices.md) §TypeScript. |
| F3  | **Replace `console` logs with structured logger** (Winston or Pino)          | Enables environment-scoped log levels and prevents sensitive data leakage in production.                                        |
| F4  | **Add Redis caching layer**                                                  | Minimize DB lookups for session validation and project configs. Phase 3 only.                                                   |
| F5  | **Set up CI/CD pipeline** (GitHub Actions)                                   | No automated testing or deployment pipeline exists.                                                                             |

---

## ✅ Verification Checklist

### P0 (Completed)

- [x] `npm run dev` starts without throwing `TypeError: z.email is not a function`
- [x] `GET /api/v1/projects` returns project list for authenticated user (not 403)
- [x] Password does not appear in stdout when calling `/login` or `/register`
- [x] Rate limiter blocks brute-force on `/login`, `/register`, `/forgot-password`, `/reset-password`

### Testing (Next)

- [ ] `npm test` runs Vitest and exits 0
- [ ] `POST /api/v1/auth/register` → 201, user in DB
- [ ] `POST /api/v1/auth/login` → 200, cookies set
- [ ] `POST /api/v1/auth/refresh-access-token` → new access token returned
- [ ] `GET /api/v1/projects` with valid token → 200, array returned
- [ ] `POST /api/v1/projects` with valid token → 201, project created
- [ ] `GET /api/v1/auth/get-all-users` without token → 401
- [ ] `DELETE /api/v1/projects/:id` as non-admin member → 403

---

## 📊 Maturity Scorecard

| Dimension            | Score  | Notes                                                      |
| -------------------- | ------ | ---------------------------------------------------------- |
| Product Maturity     | 4 / 10 | Notes & Attachments missing                                |
| Architecture         | 7 / 10 | Clean layering, SOLID principles, good normalization       |
| Code Quality         | 6 / 10 | Readable; HTTP method/status code inconsistencies remain   |
| Scalability          | 5 / 10 | No caching, no indexes                                     |
| Security             | 6 / 10 | ↑ Credential logging fixed, RBAC fixed, rate limiter added |
| Production Readiness | 3 / 10 | ↑ Server starts; still no tests, no CI/CD                  |
