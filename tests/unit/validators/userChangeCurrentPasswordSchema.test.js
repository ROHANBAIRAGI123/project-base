import { userChangeCurrentPasswordSchema } from '../../../src/validators/index.js';

// strongPasswordSchema: min 8 chars, lower + upper + digit + special char
const VALID_NEW_PASSWORD = 'NewPass@123';

describe('userChangeCurrentPasswordSchema — Zod validation', () => {
    test('should pass with valid old, new, and matching confirm password', () => {
        const result = userChangeCurrentPasswordSchema.safeParse({
            body: {
                oldPassword: 'OldPass@456',
                newPassword: VALID_NEW_PASSWORD,
                confirmPassword: VALID_NEW_PASSWORD,
            },
        });

        expect(result.success).toBe(true);
    });

    test('should fail when confirmPassword does not match newPassword', () => {
        const result = userChangeCurrentPasswordSchema.safeParse({
            body: {
                oldPassword: 'OldPass@456',
                newPassword: VALID_NEW_PASSWORD,
                confirmPassword: 'WrongPass@999',
            },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('confirmPassword')
        );
        expect(err).toBeDefined();
        expect(err.message).toBe('Password confirmation does not match');
    });

    test('should fail when newPassword is the same as oldPassword', () => {
        const result = userChangeCurrentPasswordSchema.safeParse({
            body: {
                oldPassword: VALID_NEW_PASSWORD,
                newPassword: VALID_NEW_PASSWORD,
                confirmPassword: VALID_NEW_PASSWORD,
            },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('newPassword')
        );
        expect(err).toBeDefined();
        expect(err.message).toBe('New password must be different from current password');
    });

    test('should fail when oldPassword is empty', () => {
        const result = userChangeCurrentPasswordSchema.safeParse({
            body: {
                oldPassword: '',
                newPassword: VALID_NEW_PASSWORD,
                confirmPassword: VALID_NEW_PASSWORD,
            },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('oldPassword')
        );
        expect(err).toBeDefined();
    });

    test('should fail when newPassword does not meet strong password requirements', () => {
        const result = userChangeCurrentPasswordSchema.safeParse({
            body: {
                oldPassword: 'OldPass@456',
                newPassword: 'weakpassword', // no uppercase, digit, or special char
                confirmPassword: 'weakpassword',
            },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('newPassword')
        );
        expect(err).toBeDefined();
    });
});
