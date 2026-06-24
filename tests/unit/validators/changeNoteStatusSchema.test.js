import { changeNoteStatusSchema } from '../../../src/validators/index.js';

const VALID_PROJECT_ID = '507f1f77bcf86cd799439011';
const VALID_NOTE_ID    = '507f1f77bcf86cd799439015';

describe('changeNoteStatusSchema — Zod validation', () => {
    test('should pass with status "personal" and valid params', () => {
        const result = changeNoteStatusSchema.safeParse({
            body: { status: 'personal' },
            params: { projectId: VALID_PROJECT_ID, noteId: VALID_NOTE_ID },
        });

        expect(result.success).toBe(true);
    });

    test('should pass with status "shared" and valid params', () => {
        const result = changeNoteStatusSchema.safeParse({
            body: { status: 'shared' },
            params: { projectId: VALID_PROJECT_ID, noteId: VALID_NOTE_ID },
        });

        expect(result.success).toBe(true);
    });

    test('should fail when status is not a valid enum value', () => {
        const result = changeNoteStatusSchema.safeParse({
            body: { status: 'archived' },
            params: { projectId: VALID_PROJECT_ID, noteId: VALID_NOTE_ID },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('status'));
        expect(err).toBeDefined();
    });

    test('should fail when status is missing from body', () => {
        const result = changeNoteStatusSchema.safeParse({
            body: {},
            params: { projectId: VALID_PROJECT_ID, noteId: VALID_NOTE_ID },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('status'));
        expect(err).toBeDefined();
    });

    test('should fail when noteId param is invalid', () => {
        const result = changeNoteStatusSchema.safeParse({
            body: { status: 'shared' },
            params: { projectId: VALID_PROJECT_ID, noteId: 'not-a-mongo-id' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('noteId'));
        expect(err).toBeDefined();
    });
});
