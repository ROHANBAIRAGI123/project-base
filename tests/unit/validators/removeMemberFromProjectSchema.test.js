import { removeMemberFromProjectSchema } from '../../../src/validators/index.js';

const VALID_PROJECT_ID = '507f1f77bcf86cd799439011';
const VALID_MEMBER_ID  = '507f1f77bcf86cd799439013';

describe('removeMemberFromProjectSchema — Zod validation', () => {
    test('should pass with valid projectId and memberId params', () => {
        const result = removeMemberFromProjectSchema.safeParse({
            params: {
                projectId: VALID_PROJECT_ID,
                memberId: VALID_MEMBER_ID,
            },
        });

        expect(result.success).toBe(true);
    });

    test('should fail when memberId is not a valid mongo id', () => {
        const result = removeMemberFromProjectSchema.safeParse({
            params: {
                projectId: VALID_PROJECT_ID,
                memberId: 'invalid-id',
            },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('memberId')
        );
        expect(err).toBeDefined();
    });

    test('should fail when projectId is not a valid mongo id', () => {
        const result = removeMemberFromProjectSchema.safeParse({
            params: {
                projectId: 'bad',
                memberId: VALID_MEMBER_ID,
            },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('projectId')
        );
        expect(err).toBeDefined();
    });
});
