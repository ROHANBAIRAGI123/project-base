import { describe, it } from 'vitest';

// authRateLimiter: 10 requests per 15-minute window per IP
// Applied to: POST /register, POST /login, POST /forgot-password, POST /reset-password/:token
//
// globalRateLimiter: 100 requests per 1-minute window per IP
// Applied globally to all routes via app.js
//
// NOTE: In tests, the in-memory store state persists within a test run.
// Consider resetting or using a short windowMs for these tests.

describe('authRateLimiter — /login brute-force protection (10 req / 15 min)', () => {
    it.todo('should return 200 on the 10th request within the window');

    it.todo('should return 429 Too Many Requests on the 11th request within the window');

    it.todo('should include a Retry-After header or RateLimit headers in the 429 response');

    it.todo('should return the configured error message body when rate limit is exceeded');

    it.todo('should reset the counter and allow requests after the window expires');
});

describe('authRateLimiter — /register brute-force protection', () => {
    it.todo('should return 429 after 10 registration attempts from the same IP within 15 minutes');
});

describe('authRateLimiter — /forgot-password brute-force protection', () => {
    it.todo('should return 429 after 10 forgot-password attempts from the same IP within 15 minutes');
});

describe('globalRateLimiter — general API DoS protection (100 req / 1 min)', () => {
    it.todo('should return 200 on the 100th request within the window');

    it.todo('should return 429 on the 101st request within the 1-minute window');

    it.todo('should include standard RateLimit-* headers on every response');

    it.todo('should track limits per IP address independently (two clients do not share the counter)');
});
