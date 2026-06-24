import { deleteUserSchema } from '../../../src/validators/index.js';

describe('deleteUserSchema — Zod validation', () => {
    test('should pass when password is provided', () => {
        const result = deleteUserSchema.safeParse({
            body: { password: 'anypassword' },
        });

        expect(result.success).toBe(true);
    });

    test('should fail when password is an empty string', () => {
        const result = deleteUserSchema.safeParse({
            body: { password: '' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('password'));
        expect(err).toBeDefined();
    });

    test('should fail when password field is missing', () => {
        const result = deleteUserSchema.safeParse({
            body: {},
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('password'));
        expect(err).toBeDefined();
    });
});
