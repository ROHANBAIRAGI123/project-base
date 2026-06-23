import request from 'supertest';
import app from '../../../src/app.js';

// Notes are mounted at: /api/v1/:projectId/notes (check app.js)
// Full paths (based on note.routes.js mounted at /api/v1/:projectId):
//   GET    /api/v1/:projectId/         → getNotes
//   POST   /api/v1/:projectId/         → createNote
//   GET    /api/v1/:projectId/note/:noteId     → getNoteById
//   PUT    /api/v1/:projectId/note/:noteId     → updateNote
//   DELETE /api/v1/:projectId/note/:noteId     → deleteNote
//   PATCH  /api/v1/:projectId/note/:noteId/status → changeNoteStatus
//
// KEY OWNERSHIP RULE: Any project member can CREATE notes.
// But only the NOTE OWNER can update, delete, or change status.
// This is different from tasks — it's enforced in the controller, not RBAC middleware.
//
// Note visibility:
//   PERSONAL → only visible to the note owner
//   SHARED   → visible to all project members

describe('POST /api/v1/:projectId/ — Create Note', () => {
    test.todo('should return 201 when any project member (Admin) creates a note');

    test.todo('should return 201 when a Project Admin creates a note');

    test.todo('should return 201 when a Member creates a note');

    test.todo('should return 401 when request is made without authentication');

    test.todo('should return 403 when user is not a member of the project');

    test.todo('should default note status to PERSONAL when status is not provided');

    test.todo('should return 400 when title is missing');
});

describe('GET /api/v1/:projectId/ — Get Notes', () => {
    test.todo('should return 200 and include SHARED notes for all project members');

    test.todo('should return PERSONAL notes only to the note owner, not other members');

    test.todo('should return 401 when request is made without authentication');

    test.todo('should return 403 when user is not a member of the project');
});

describe('GET /api/v1/:projectId/note/:noteId — Get Note By ID', () => {
    test.todo('should return 200 when owner fetches their own PERSONAL note');

    test.todo('should return 200 when any member fetches a SHARED note');

    test.todo('should return 404 when a non-owner tries to fetch someone else\'s PERSONAL note');

    test.todo('should return 404 when noteId does not exist');
});

describe('PUT /api/v1/:projectId/note/:noteId — Update Note', () => {
    test.todo('should return 200 when the note owner updates title or content');

    test.todo('should return 403 when a different project member tries to update someone else\'s note');

    test.todo('should return 401 when request is made without authentication');

    test.todo('should return 404 when noteId does not exist');
});

describe('DELETE /api/v1/:projectId/note/:noteId — Delete Note', () => {
    test.todo('should return 200 when the note owner deletes their note');

    test.todo('should return 403 when a different project member tries to delete someone else\'s note');

    test.todo('should return 401 when request is made without authentication');

    test.todo('should return 404 when noteId does not exist');
});

describe('PATCH /api/v1/:projectId/note/:noteId/status — Change Note Status', () => {
    test.todo('should return 200 when owner changes status from PERSONAL to SHARED');

    test.todo('should return 200 when owner changes status from SHARED to PERSONAL');

    test.todo('should return 400 when owner tries to set the same status that is already set');

    test.todo('should return 403 when a non-owner tries to change the note status');

    test.todo('should return 400 when status value is not one of: personal, shared');
});
