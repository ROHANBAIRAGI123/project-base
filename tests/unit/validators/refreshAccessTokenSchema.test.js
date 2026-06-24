import { refreshAccessTokenSchema } from '../../../src/validators/index.js';

describe('refreshAccessTokenSchema — Zod validation', () => {
    test('should pass when refreshToken is provided in cookies', () => {
        const result = refreshAccessTokenSchema.safeParse({
            cookies: { refreshToken: 'some-refresh-token' },
            headers: {},
        });

        expect(result.success).toBe(true);
    });

    test('should pass when authorization header is provided', () => {
        const result = refreshAccessTokenSchema.safeParse({
            cookies: {},
            headers: { authorization: 'Bearer some-access-token' },
        });

        expect(result.success).toBe(true);
    });

    test('should fail when neither cookie refreshToken nor authorization header is present', () => {
        const result = refreshAccessTokenSchema.safeParse({
            cookies: {},
            headers: {},
        });

        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
            'Refresh token is required in cookies or authorization header'
        );
    });

    test('should pass when both cookie and header are provided', () => {
        const result = refreshAccessTokenSchema.safeParse({
            cookies: { refreshToken: 'some-refresh-token' },
            headers: { authorization: 'Bearer token' },
        });

        expect(result.success).toBe(true);
    });
});
