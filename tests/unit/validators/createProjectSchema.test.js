import { createProjectSchema } from '../../../src/validators/index.js';

describe('createProjectSchema — Zod validation', () => {
    test('should pass with a valid project name', () => {
        const result = createProjectSchema.safeParse({
            body: { name: 'My Project' },
        });

        expect(result.success).toBe(true);
    });

    test('should pass with a valid name and description', () => {
        const result = createProjectSchema.safeParse({
            body: {
                name: 'My Project',
                description: 'A detailed description of the project.',
            },
        });

        expect(result.success).toBe(true);
    });

    test('should fail when name is missing', () => {
        const result = createProjectSchema.safeParse({
            body: {},
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('name'));
        expect(err).toBeDefined();
    });

    test('should fail when name contains disallowed special characters', () => {
        const result = createProjectSchema.safeParse({
            body: { name: 'Project@#$!' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('name'));
        expect(err).toBeDefined();
    });

    test('should fail when name is an empty string', () => {
        const result = createProjectSchema.safeParse({
            body: { name: '' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('name'));
        expect(err).toBeDefined();
    });
});
