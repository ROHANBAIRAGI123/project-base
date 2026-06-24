import { updateProjectSchema } from '../../../src/validators/index.js';

const VALID_PROJECT_ID = '507f1f77bcf86cd799439011';

describe('updateProjectSchema — Zod validation', () => {
    test('should pass when only name is provided', () => {
        const result = updateProjectSchema.safeParse({
            body: { name: 'Updated Name' },
            params: { projectId: VALID_PROJECT_ID },
        });

        expect(result.success).toBe(true);
    });

    test('should pass when only description is provided', () => {
        const result = updateProjectSchema.safeParse({
            body: { description: 'A new description.' },
            params: { projectId: VALID_PROJECT_ID },
        });

        expect(result.success).toBe(true);
    });

    test('should fail when body is empty (refine: at least one field required)', () => {
        const result = updateProjectSchema.safeParse({
            body: {},
            params: { projectId: VALID_PROJECT_ID },
        });

        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
            'At least one field must be provided for update'
        );
    });

    test('should fail when projectId param is not a valid 24-char hex id', () => {
        const result = updateProjectSchema.safeParse({
            body: { name: 'Valid Name' },
            params: { projectId: 'not-a-valid-id' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('projectId')
        );
        expect(err).toBeDefined();
    });
});
