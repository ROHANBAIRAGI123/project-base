import { Router } from "express";
import {
  validate,
  createValidationLayer,
} from "../middlewares/validation.middleware.js";
import { sanitizeAndValidateInput } from "../middlewares/sanitization.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";
import { checkProjectPermission } from "../middlewares/permission.middleware.js";
import {
  createNoteSchema,
  updateNoteSchema,
  changeNoteStatusSchema,
  noteParamsSchema,
  projectNoteParamsSchema,
} from "../validators/index.js";
import {
  getNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  changeNoteStatus,
} from "../controllers/note.controllers.js";

const router = Router({ mergeParams: true });

// GET /   — list all notes in a project (shared + own personal)
// POST /  — create a new note in a project
router
  .route("/")
  .get(
    validate(projectNoteParamsSchema),
    verifyJWT,
    checkProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    getNotes,
  )
  .post(
    ...createValidationLayer({
      schema: createNoteSchema,
      sanitize: true,
      validateSecurity: true,
    }),
    verifyJWT,
    checkProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    createNote,
  );

// GET    /note/:noteId  — fetch a single note
// PUT    /note/:noteId  — update a note (owner only)
// DELETE /note/:noteId  — delete a note (owner only)
router
  .route("/note/:noteId")
  .get(
    validate(noteParamsSchema),
    verifyJWT,
    checkProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    getNoteById,
  )
  .put(
    ...sanitizeAndValidateInput({
      enableXSSProtection: true,
      enableSQLProtection: true,
      customSanitizers: {
        title: (value) => value?.trim().replace(/[<>]/g, ""),
        content: (value) => value?.trim(),
      },
    }),
    validate(updateNoteSchema),
    verifyJWT,
    checkProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    updateNote,
  )
  .delete(
    validate(noteParamsSchema),
    verifyJWT,
    checkProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    deleteNote,
  );

// PATCH /note/:noteId/status — toggle PERSONAL / SHARED (owner only)
router
  .route("/note/:noteId/status")
  .patch(
    validate(changeNoteStatusSchema),
    verifyJWT,
    checkProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ]),
    changeNoteStatus,
  );

export default router;

/*
 * ===========================================================================================
 *                              NOTES — note.routes.js
 * ===========================================================================================
 *
 * PURPOSE: Maps all project-note HTTP requests to controllers with full validation,
 *          sanitization, authentication, and RBAC on every route.
 * ROLE IN ARCHITECTURE: Routing layer. Mounted in app.js on /api/v1/:projectId with
 *                       mergeParams: true so :projectId is accessible downstream.
 *
 * ROUTE SUMMARY:
 * - GET    /                    -> getNotes          (all members: read shared + own)
 * - POST   /                    -> createNote        (all members: create personal/shared)
 * - GET    /note/:noteId        -> getNoteById       (all members: read shared + own)
 * - PUT    /note/:noteId        -> updateNote        (owner only)
 * - DELETE /note/:noteId        -> deleteNote        (owner only)
 * - PATCH  /note/:noteId/status -> changeNoteStatus  (owner only: toggle visibility)
 *
 * MIDDLEWARE CHAIN (per route):
 * 1. validate / createValidationLayer  — Zod schema validation (body + params)
 * 2. sanitizeAndValidateInput          — XSS / SQL injection sanitization (mutation routes)
 * 3. verifyJWT                         — Authentication
 * 4. checkProjectPermission            — RBAC: confirms project membership + role
 * 5. Controller                        — Business logic
 *
 * DESIGN PATTERNS:
 * - Defense-in-Depth: Validation -> Auth -> RBAC -> Controller.
 * - Schema-first Routing: All routes reference named Zod schemas from validators/index.js.
 *
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. What does mergeParams: true do?
 *    Answer: Lets this child router access :projectId from the parent app.js mount point,
 *    required by checkProjectPermission and the param schemas.
 * 2. Why do all note operations allow MEMBER role, unlike tasks that restrict writes to ADMIN?
 *    Answer: Notes are personal productivity tools — any member can manage their own notes.
 *    Write-protection is enforced at the ownership level inside the controller.
 */
