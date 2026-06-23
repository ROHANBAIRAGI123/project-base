// userRegisterSchema validates: username, email, password, role
// Import it from: import { userRegisterSchema } from '../../../src/validators/index.js'
// Usage: const result = userRegisterSchema.safeParse({ ... });
//        expect(result.success).toBe(true);

describe('userRegisterSchema — Zod validation', () => {
    test.todo('should pass with valid username, email, and password');

    test.todo('should fail when email is not a valid email format');

    test.todo('should fail when password is shorter than the minimum length');

    test.todo('should fail when username is missing');

    test.todo('should fail when email is missing');

    test.todo('should strip unknown extra fields from the parsed output');
});
