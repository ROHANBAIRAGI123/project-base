import { Router } from "express";
import { validate, createValidationLayer } from "../middlewares/validation.middleware.js";
import { sanitizeAndValidateInput } from "../middlewares/sanitization.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";
import { checkProjectPermission } from "../middlewares/permission.middleware.js";

// Add note validation schemas here when you create them in src/validators/index.js
// import {
//   createNoteSchema,
//   updateNoteSchema,
//   noteParamsSchema,
//   projectNoteParamsSchema,
// } from "../validators/index.js";

import {
  getNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  changeNoteStatus
} from "../controllers/note.controllers.js";

const router = Router({ mergeParams: true });

// Notes list for a project
router.route("/:projectId").get(
	// getNotes,
);

// Create a note for a project
router.route("/:projectId").post(
	...createValidationLayer({
		// schema: createNoteSchema,
		sanitize: true,
		validateSecurity: true,
	}),
	// createNote,
);

// Get one note
router.route("/:projectId/note/:noteId").get(
	// validate(noteParamsSchema),
	// getNoteById,
);

// Update one note
router.route("/:projectId/note/:noteId").put(
	...sanitizeAndValidateInput({
		enableXSSProtection: true,
		enableSQLProtection: true,
	}),
	// validate(updateNoteSchema),
	// updateNote,
);

// Delete one note
router.route("/:projectId/note/:noteId").delete(

	// validate(noteParamsSchema),
	// deleteNote,
);

router.route("/:projectId/note/:noteId/status").patch(
    // validate(noteParamsSchema),
    // changeNoteStatus,
);

export default router;
