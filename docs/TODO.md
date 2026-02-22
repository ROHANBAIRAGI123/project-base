# PRD-to-Codebase Gap Resolution TODO

The codebase is approximately 50% complete with significant gaps in RBAC, route wiring, and missing feature modules. Critical runtime issues exist that will prevent the server from starting.

---

## Auth Module

### High Priority (Security/RBAC)

1. Add Zod validation for `POST /refresh-access-token` — currently accepts unvalidated body ([auth.routes.js](src/routers/auth.routes.js))

2. Add Zod validation for `POST /delete-user` — takes email+password with no validation ([auth.routes.js](src/routers/auth.routes.js#L82))

3. Protect `GET /get-all-users` with `verifyJWT` middleware — currently publicly accessible, exposes all user data ([auth.routes.js](src/routers/auth.routes.js#L83))

4. Fix `deleteUser` controller to verify `req.user` matches the user being deleted — any authenticated user can delete others ([auth.controllers.js](src/controllers/auth.controllers.js#L95))

5. Add `isEmailVerified` check in `loginUser` — users can log in without verified email ([auth.controllers.js](src/controllers/auth.controllers.js#L40))

6. Fix `refreshTokenExpiry` — field exists in User model but `generateRefreshToken()` never sets it ([user.model.js](src/models/user.model.js#L91))

7. Remove debug logging middleware that logs request bodies including passwords, or gate it with `NODE_ENV` check ([app.js](src/app.js#L18-L23))

8. Remove duplicate CORS call — first permissive `cors()` overrides configured CORS ([app.js](src/app.js#L12))

### Medium Priority (Core Logic)

9. Verify `confirmPassword` matches `newPassword` in `resetPassword` controller — schema validates but controller ignores ([auth.controllers.js](src/controllers/auth.controllers.js#L211))

10. Add `username` to `userProfileUpdateSchema` — controller accepts it but schema doesn't ([validators/index.js](src/validators/index.js#L105))

11. Add `bio`, `location`, `website` fields to User model — schema accepts them but model doesn't store ([user.model.js](src/models/user.model.js))

12. Add index on `email` field in User model for query performance ([user.model.js](src/models/user.model.js))

### Low Priority (Consistency)

13. Fix HTTP method mismatch: PRD says `POST /change-password`, code uses `PATCH` ([auth.routes.js](src/routers/auth.routes.js))

14. Align path names with PRD: `/refresh-access-token` → `/refresh-token`, `/me` → `/current-user`

15. Fix `loginUser` to return `200` instead of `201` ([auth.controllers.js](src/controllers/auth.controllers.js#L78))

---

## Projects Module

### High Priority (Security/RBAC)

16. **CRITICAL:** Import and mount project routes in [app.js](src/app.js) — currently not mounted, API inaccessible

17. Import `verifyJWT` in [project.routes.js](src/routers/project.routes.js) and apply to all routes

18. Import `chechProjectPermission` (fix typo to `checkProjectPermission`) and apply Admin-only middleware to:
    - `PATCH /:projectId` (update project)
    - `DELETE /:id` (delete project)
    - `POST /:projectId/members` (add member)
    - `DELETE /:projectId/members/:memberId` (remove member)
    - `PATCH /:projectId/members/:memberId/role` (update role)

19. Apply any-member permission check to:
    - `GET /` (list projects)
    - `GET /:id` (get project details)

### Medium Priority (Core Logic)

20. **CRITICAL:** Uncomment/wire controller imports in [project.routes.js](src/routers/project.routes.js) — all routes have validation but no handlers (lines 36, 43, 49, 56, 62, 70, 75, 80)

21. Add Note deletion to `deleteProject` controller — currently skips notes ([project.controllers.js](src/controllers/project.controllers.js#L118))

22. Add compound unique index on `{ user, project }` in ProjectMember to prevent duplicates ([projectMember.model.js](src/models/projectMember.model.js))

23. Fix `isPrivate` and `tags` fields mismatch — validator accepts but model/controller don't handle

24. Fix `tasks` field in Project model — currently a single ObjectId, should be removed (tasks reference their project) ([project.model.js](src/models/project.model.js#L17))

25. Consider removing global uniqueness on project `name` — prevents users from reusing names ([project.model.js](src/models/project.model.js))

### Low Priority (Consistency)

26. Fix HTTP method mismatch: PRD says `PUT /:projectId`, code uses `PATCH`

27. Standardize param names: some routes use `:id`, others use `:projectId`

28. Fix controllers returning `201` instead of `200` for GET/PATCH/DELETE operations ([project.controllers.js](src/controllers/project.controllers.js))

---

## Tasks Module

### High Priority (Security/RBAC)

29. **CRITICAL FIX:** Import `taskRoutes` in [app.js](src/app.js#L36) — server crashes with `ReferenceError` on startup

30. Import `verifyJWT` in [task.routes.js](src/routers/task.routes.js) and apply to all routes

31. Apply Admin/Project Admin permission middleware to:
    - `POST /task` (create task)
    - `PATCH /task/:taskId` (update task)
    - `DELETE /task/:taskId` (delete task)
    - `POST /task/:taskId/subtask` (create subtask)
    - `DELETE /subtask/:subtaskId` (delete subtask)

32. Apply any-member permission to:
    - `GET /tasks` (list tasks)
    - `GET /task/:taskId` (get task details)
    - `PATCH /subtask/:subtaskId` (update subtask — all members can update status)

### Medium Priority (Core Logic)

33. **CRITICAL:** Implement all task controller stubs — every function is empty with only `//:TODO`:
    - `getTasks` ([task.controllers.js](src/controllers/task.controllers.js#L13))
    - `postTask` ([task.controllers.js](src/controllers/task.controllers.js#L18))
    - `getTaskDetails` ([task.controllers.js](src/controllers/task.controllers.js#L23))
    - `updateTaskById` ([task.controllers.js](src/controllers/task.controllers.js#L28))
    - `deleteTaskById` ([task.controllers.js](src/controllers/task.controllers.js#L33))
    - `createSubTask` ([task.controllers.js](src/controllers/task.controllers.js#L38))
    - `updateSubtask` ([task.controllers.js](src/controllers/task.controllers.js#L43))
    - `deleteSubTask` ([task.controllers.js](src/controllers/task.controllers.js#L48))

34. Wire controller imports in [task.routes.js](src/routers/task.routes.js) — all commented out

35. Add missing fields to Task model: `dueDate`, `estimatedHours`, `actualHours`, `tags`, `createdBy`, `attachments` ([task.model.js](src/models/task.model.js))

36. Add `assignedTo` field to SubTask model ([subtask.model.js](src/models/subtask.model.js))

37. Install Multer and configure file upload middleware for task attachments — PRD requires it, not installed ([package.json](package.json))

38. Remove global uniqueness on task `title` — prevents same title across projects ([task.model.js](src/models/task.model.js))

39. Remove global uniqueness on subtask `title` ([subtask.model.js](src/models/subtask.model.js))

40. Add compound indexes on Task model: `(project, status)`, `(project, assignedTo)`

### Low Priority (Consistency)

41. Align URL structure with PRD: current `/task/:taskId` vs PRD's `/t/:taskId`

42. Fix HTTP method: PRD says `PUT`, code uses `PATCH`

---

## Notes Module

### High Priority (Security/RBAC)

43. Create [note.routes.js](src/routers/note.routes.js) with proper `verifyJWT` and permission middleware:
    - `GET /:projectId` — any member
    - `POST /:projectId` — Admin only
    - `GET /:projectId/n/:noteId` — any member
    - `PUT /:projectId/n/:noteId` — Admin only
    - `DELETE /:projectId/n/:noteId` — Admin only

44. Mount note routes in [app.js](src/app.js) at `/api/v1/notes`

### Medium Priority (Core Logic)

45. Create [note.controllers.js](src/controllers/note.controllers.js) with all CRUD operations:
    - `getNotes`
    - `createNote`
    - `getNoteById`
    - `updateNote`
    - `deleteNote`

46. Create Zod validation schemas for note create/update in [validators/index.js](src/validators/index.js)

47. The Note model exists ([note.model.js](src/models/note.model.js)) and appears complete — just needs controller/route integration

---

## Project Invitations Module

### High Priority (Security/RBAC)

48. Mount invitation routes in [app.js](src/app.js) — currently not mounted

49. Import `verifyJWT` in [projectInvite.routes.js](src/routers/projectInvite.routes.js) and apply to protected routes

50. Apply Admin-only permission to invitation management endpoints

### Medium Priority (Core Logic)

51. Wire controller imports in [projectInvite.routes.js](src/routers/projectInvite.routes.js) — all commented out

52. Fix schema/controller mismatch: `addMemberToProjectSchema` expects `email` in body, but `sendProjectInvitation` controller expects `userId` ([validators/index.js](src/validators/index.js#L131) vs [projectInvite.controllers.js](src/controllers/projectInvite.controllers.js#L7))

---

## Cross-Cutting Concerns

### High Priority (Security)

53. Add rate limiting middleware (e.g., `express-rate-limit`) — docs mention it but not implemented

54. Fix permission middleware typo: `chechProjectPermission` → `checkProjectPermission` ([permission.middleware.js](src/middlewares/permission.middleware.js))

### Low Priority (Refactoring)

55. Move `nodemon` from `dependencies` to `devDependencies` ([package.json](package.json#L37))

56. Add test infrastructure — `npm test` currently exits with error

57. Add `ApiResponse` statusCode consistency — some responses pass `200` to constructor but `res.status(201)` to response

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

- **URL structure:** Align with PRD (`/t/:taskId` vs `/task/:taskId`) or document deviation

- **HTTP methods:** PRD specifies `PUT` for updates, code uses `PATCH` — choose one and be consistent

- **Global uniqueness:** Remove from task/subtask titles per project scope, or add project-scoped compound unique indexes

