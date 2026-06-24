import { updateMemberRoleSchema } from '../../../src/validators/index.js';

const VALID_PROJECT_ID = '507f1f77bcf86cd799439011';
const VALID_MEMBER_ID  = '507f1f77bcf86cd799439013';

describe('updateMemberRoleSchema — Zod validation', () => {
    test('should pass with a valid role and valid params', () => {
        const result = updateMemberRoleSchema.safeParse({
            body: { role: 'project_admin' },
            params: {
                projectId: VALID_PROJECT_ID,
                memberId: VALID_MEMBER_ID,
            },
        });

        expect(result.success).toBe(true);
    });

    test('should fail when role is not a valid enum value', () => {
        const result = updateMemberRoleSchema.safeParse({
            body: { role: 'owner' },
            params: {
                projectId: VALID_PROJECT_ID,
                memberId: VALID_MEMBER_ID,
            },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('role'));
        expect(err).toBeDefined();
    });

    test('should fail when role is missing from body', () => {
        const result = updateMemberRoleSchema.safeParse({
            body: {},
            params: {
                projectId: VALID_PROJECT_ID,
                memberId: VALID_MEMBER_ID,
            },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('role'));
        expect(err).toBeDefined();
    });

    test('should fail when memberId param is invalid', () => {
        const result = updateMemberRoleSchema.safeParse({
            body: { role: 'member' },
            params: {
                projectId: VALID_PROJECT_ID,
                memberId: 'not-an-id',
            },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('memberId')
        );
        expect(err).toBeDefined();
    });
});
