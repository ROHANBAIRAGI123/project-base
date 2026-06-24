import { userProfileUpdateSchema } from '../../../src/validators/index.js';

describe('userProfileUpdateSchema — Zod validation', () => {
    test('should pass when only fullname is provided', () => {
        const result = userProfileUpdateSchema.safeParse({
            body: { fullname: 'Jane Doe' },
        });

        expect(result.success).toBe(true);
    });

    test('should pass when email and username are both provided', () => {
        const result = userProfileUpdateSchema.safeParse({
            body: {
                email: 'updated@example.com',
                username: 'updateduser',
            },
        });

        expect(result.success).toBe(true);
    });

    test('should fail when body is completely empty (refine: at least one field required)', () => {
        const result = userProfileUpdateSchema.safeParse({
            body: {},
        });

        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
            'At least one field must be provided for update'
        );
    });

    test('should fail when email is in invalid format', () => {
        const result = userProfileUpdateSchema.safeParse({
            body: { email: 'not-an-email' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('email'));
        expect(err).toBeDefined();
    });

    test('should fail when username starts with a hyphen', () => {
        const result = userProfileUpdateSchema.safeParse({
            body: { username: '-baduser' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('username')
        );
        expect(err).toBeDefined();
    });
});
