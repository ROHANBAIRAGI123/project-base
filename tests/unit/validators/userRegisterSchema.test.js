import { userRegisterSchema } from '../../../src/validators/index.js';

// STRONG_PASSWORD_MIN_LENGTH = 8, must have lower, upper, digit, special char
const VALID_PASSWORD = 'Secure@123';
const VALID_PAYLOAD = {
    body: {
        email: 'user@example.com',
        username: 'validuser',
        password: VALID_PASSWORD,
        fullname: 'John Doe',
    },
};

describe('userRegisterSchema — Zod validation', () => {
    test('should pass with valid username, email, password, and fullname', () => {
        const result = userRegisterSchema.safeParse(VALID_PAYLOAD);
        expect(result.success).toBe(true);
    });

    test('should fail when email is not a valid email format', () => {
        const result = userRegisterSchema.safeParse({
            body: { ...VALID_PAYLOAD.body, email: 'not-an-email' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('email'));
        expect(err).toBeDefined();
    });

    test('should fail when password is shorter than the minimum length', () => {
        // strongPasswordSchema requires min 8 chars
        const result = userRegisterSchema.safeParse({
            body: { ...VALID_PAYLOAD.body, password: 'Ab@1' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('password'));
        expect(err).toBeDefined();
    });

    test('should fail when password lacks required character types', () => {
        // Missing special character
        const result = userRegisterSchema.safeParse({
            body: { ...VALID_PAYLOAD.body, password: 'Secure1234' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('password'));
        expect(err).toBeDefined();
    });

    test('should fail when username is missing', () => {
        const { username, ...bodyWithoutUsername } = VALID_PAYLOAD.body;
        const result = userRegisterSchema.safeParse({ body: bodyWithoutUsername });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('username'));
        expect(err).toBeDefined();
    });

    test('should fail when email is missing', () => {
        const { email, ...bodyWithoutEmail } = VALID_PAYLOAD.body;
        const result = userRegisterSchema.safeParse({ body: bodyWithoutEmail });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('email'));
        expect(err).toBeDefined();
    });

    test('should strip unknown extra fields from the parsed output', () => {
        const result = userRegisterSchema.safeParse({
            body: { ...VALID_PAYLOAD.body, unknownField: 'should-be-stripped' },
        });

        expect(result.success).toBe(true);
        expect(result.data.body.unknownField).toBeUndefined();
    });
});
