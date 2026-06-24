import { addMemberToProjectSchema } from '../../../src/validators/index.js';

const VALID_PROJECT_ID = '507f1f77bcf86cd799439011';
const VALID_USER_ID    = '507f1f77bcf86cd799439012';

describe('addMemberToProjectSchema — Zod validation', () => {
    test('should pass with a valid userId, role, and projectId', () => {
        const result = addMemberToProjectSchema.safeParse({
            body: {
                userId: VALID_USER_ID,
                role: 'member',
            },
            params: { projectId: VALID_PROJECT_ID },
        });

        expect(result.success).toBe(true);
    });

    test('should pass with all valid roles (admin, project_admin, member)', () => {
        for (const role of ['admin', 'project_admin', 'member']) {
            const result = addMemberToProjectSchema.safeParse({
                body: { userId: VALID_USER_ID, role },
                params: { projectId: VALID_PROJECT_ID },
            });
            expect(result.success).toBe(true);
        }
    });

    test('should fail when role is not a valid enum value', () => {
        const result = addMemberToProjectSchema.safeParse({
            body: { userId: VALID_USER_ID, role: 'superadmin' },
            params: { projectId: VALID_PROJECT_ID },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('role'));
        expect(err).toBeDefined();
    });

    test('should fail when userId is not a valid mongo id format', () => {
        const result = addMemberToProjectSchema.safeParse({
            body: { userId: 'invalid-id', role: 'member' },
            params: { projectId: VALID_PROJECT_ID },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('userId'));
        expect(err).toBeDefined();
    });

    test('should fail when projectId param is invalid', () => {
        const result = addMemberToProjectSchema.safeParse({
            body: { userId: VALID_USER_ID, role: 'member' },
            params: { projectId: 'bad-id' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('projectId')
        );
        expect(err).toBeDefined();
    });
});
