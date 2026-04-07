# PRD-to-Codebase Gap Resolution TODO

The codebase is approximately 50% complete with significant gaps in RBAC, route wiring, and missing feature modules. Critical runtime issues exist that will prevent the server from starting.

---

## Auth Module

### High Priority (Security/RBAC)

1. Add Zod validation for `POST /refresh-access-token` — currently accepts unvalidated body ([auth.routes.js](src/routers/auth.routes.js))

2. Add Zod validation for `POST /delete-user` — takes email+password with no validation ([auth.routes.js](src/routers/auth.routes.js#L82))

3. Remove debug logging middleware that logs request bodies including passwords, or gate it with `NODE_ENV` check ([app.js](src/app.js#L18-L23))

### Medium Priority (Core Logic)


4. Add `bio`, `location`, `website` fields to User model — schema accepts them but model doesn't store ([user.model.js](src/models/user.model.js))


### Low Priority (Consistency)

5. Fix HTTP method mismatch: PRD says `POST /change-password`, code uses `PATCH` ([auth.routes.js](src/routers/auth.routes.js))

6. Align path names with PRD: `/refresh-access-token` → `/refresh-token`, `/me` → `/current-user`

7. Fix `loginUser` to return `200` instead of `201` ([auth.controllers.js](src/controllers/auth.controllers.js#L78))

---

## Projects Module


### Medium Priority (Core Logic)

13. Add Note deletion to `deleteProject` controller — currently skips notes ([project.controllers.js](src/controllers/project.controllers.js#L118))


### Low Priority (Consistency)

15. Fix HTTP method mismatch: PRD says `PUT /:projectId`, code uses `PATCH`

17. Fix controllers returning `201` instead of `200` for GET/PATCH/DELETE operations ([project.controllers.js](src/controllers/project.controllers.js))

---

## Tasks Module


### Medium Priority (Core Logic)

18. Add missing fields to Task model: `dueDate`, `estimatedHours`, `actualHours`, `tags`, `createdBy`, `attachments` ([task.model.js](src/models/task.model.js))


20. Install Multer and configure file upload middleware for task attachments — PRD requires it, not installed ([package.json](package.json))

22. Add compound indexes on Task model: `(project, status)`, `(project, assignedTo)`

### Low Priority (Consistency)

24. Fix HTTP method: PRD says `PUT`, code uses `PATCH`

---

## Notes Module

### High Priority (Security/RBAC)

25. Create [note.routes.js](src/routers/note.routes.js) with proper `verifyJWT` and permission middleware:
    - `GET /:projectId` — any member
    - `POST /:projectId` — Admin only
    - `GET /:projectId/n/:noteId` — any member
    - `PUT /:projectId/n/:noteId` — Admin only
    - `DELETE /:projectId/n/:noteId` — Admin only

26. Mount note routes in [app.js](src/app.js) at `/api/v1/notes`

### Medium Priority (Core Logic)

27. Create [note.controllers.js](src/controllers/note.controllers.js) with all CRUD operations:
    - `getNotes`
    - `createNote`
    - `getNoteById`
    - `updateNote`
    - `deleteNote`

28. Create Zod validation schemas for note create/update in [validators/index.js](src/validators/index.js)

29. The Note model exists ([note.model.js](src/models/note.model.js)) and appears complete — just needs controller/route integration

---

## Project Invitations Module

### High Priority (Security/RBAC)

31. Import `verifyJWT` in [projectInvite.routes.js](src/routers/projectInvite.routes.js) and apply to protected routes

32. Apply Admin-only permission to invitation management endpoints

### Medium Priority (Core Logic)

33. Wire controller imports in [projectInvite.routes.js](src/routers/projectInvite.routes.js) — all commented out

34. Fix schema/controller mismatch: `addMemberToProjectSchema` expects `email` in body, but `sendProjectInvitation` controller expects `userId` ([validators/index.js](src/validators/index.js#L131) vs [projectInvite.controllers.js](src/controllers/projectInvite.controllers.js#L7))

---

## Cross-Cutting Concerns

### High Priority (Security)

35. Add rate limiting middleware (e.g., `express-rate-limit`) — docs mention it but not implemented

### Low Priority (Refactoring)

36. Move `nodemon` from `dependencies` to `devDependencies` ([package.json](package.json#L37))

37. Add test infrastructure — `npm test` currently exits with error

38. Add `ApiResponse` statusCode consistency — some responses pass `200` to constructor but `res.status(201)` to response

---

## Verification

1. **Startup test:** Run `npm run dev` — should no longer crash on undefined `taskRoutes`

2. **Auth tests:**
   - Attempt `GET /api/v1/auth/get-all-users` without token — should return 401
   - Login without verified email — should be rejected

3. **RBAC tests:**
   - Access `DELETE /api/v1/projects/:id` as non-admin member — should return 403
   - Access `POST /api/v1/tasks/:projectId/task` as non-admin member — should return 403

4. **Endpoint availability:**
   - All project routes respond (not 404)
   - All task routes have implementations (not empty responses)
   - Note endpoints exist and function

---

## Decisions

- **HTTP methods:** PRD specifies `PUT` for updates, code uses `PATCH` — choose one and be consistent

