import { createNoteSchema } from '../../../src/validators/index.js';

const VALID_PROJECT_ID = '507f1f77bcf86cd799439011';

describe('createNoteSchema — Zod validation', () => {
    test('should pass with valid title, content, and projectId', () => {
        const result = createNoteSchema.safeParse({
            body: {
                title: 'Meeting Notes',
                content: 'Discussed the sprint goals.',
            },
            params: { projectId: VALID_PROJECT_ID },
        });

        expect(result.success).toBe(true);
    });

    test('should pass when an optional valid status is provided', () => {
        const result = createNoteSchema.safeParse({
            body: {
                title: 'Shared Note',
                content: 'This is shared with the team.',
                status: 'shared',
            },
            params: { projectId: VALID_PROJECT_ID },
        });

        expect(result.success).toBe(true);
    });

    test('should fail when title is missing', () => {
        const result = createNoteSchema.safeParse({
            body: { content: 'No title here.' },
            params: { projectId: VALID_PROJECT_ID },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('title'));
        expect(err).toBeDefined();
    });

    test('should fail when content exceeds 500 characters', () => {
        const result = createNoteSchema.safeParse({
            body: {
                title: 'Long Note',
                content: 'a'.repeat(501),
            },
            params: { projectId: VALID_PROJECT_ID },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('content')
        );
        expect(err).toBeDefined();
    });

    test('should fail when status is an invalid enum value', () => {
        const result = createNoteSchema.safeParse({
            body: {
                title: 'Note',
                content: 'Content.',
                status: 'archived',
            },
            params: { projectId: VALID_PROJECT_ID },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('status'));
        expect(err).toBeDefined();
    });

    test('should fail when projectId param is not a valid mongo id', () => {
        const result = createNoteSchema.safeParse({
            body: { title: 'Note', content: 'Content.' },
            params: { projectId: 'invalid' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('projectId')
        );
        expect(err).toBeDefined();
    });
});
