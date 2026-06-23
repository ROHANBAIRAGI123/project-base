import rateLimit from "express-rate-limit";


// Tier 1 — Strict limiter for unauthenticated brute-force targets:
// /login, /register, /forgot-password, /reset-password
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15-minute window
    max: 10,                   // 10 attempts per window per IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many attempts. Please try again after 15 minutes.',
    },
});

// Tier 2 — General limiter for all API routes (DoS protection)
export const globalRateLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1-minute window
    max: 100,                  // 100 requests per minute per IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please slow down.',
    },
});



/*
 * RATE LIMITING STRATEGY
 * ======================
 * Algorithm: Fixed Window Counter (default for express-rate-limit)
 *   - A counter is kept per IP address per time window.
 *   - Once the counter hits `max`, all further requests return HTTP 429.
 *   - When the window expires, the counter resets to zero.
 *
 * Known limitation: A client can burst at window boundaries (end of window N
 * + start of window N+1). Acceptable for current traffic. Upgrade to a sliding
 * window via `rate-limiter-flexible` + Redis in Phase 3 if needed.
 *
 * IMPORTANT: Limiters MUST be instantiated once at module load time.
 * If rateLimit() is called inside a middleware function, a new in-memory
 * store is created on every request — resetting the counter each time,
 * which completely disables rate limiting.
 *
 * TODO (Phase 3): Swap MemoryStore for RedisStore when Redis is introduced
 * for BullMQ. Only the `store` option needs to change — no route changes needed.
 * store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) })
 */