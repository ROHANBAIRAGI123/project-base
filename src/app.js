import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApiError } from './utils/ApiError.js';

dotenv.config();

const app = express();

app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Debug middleware - remove in production
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${req.method}] ${req.path}`);
        console.log('Content-Type:', req.get('Content-Type'));
        if (req.body) {
            const sanitizedBody = { ...req.body };
            const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken', 'oldPassword', 'newPassword', 'confirmPassword'];
            sensitiveKeys.forEach(key => {
                if (key in sanitizedBody) sanitizedBody[key] = '[REDACTED]';
            });
            console.log('Body:', sanitizedBody);
        }
    }
    next();
});

app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

import authRoutes from './routers/auth.routes.js';
import healthRoutes from './routers/healthcheck.routes.js';
import taskRoutes from "./routers/task.routes.js";
import projectInviteRoutes from "./routers/projectInvite.routes.js";
import projectRoutes from "./routers/project.routes.js";


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/healthcheck', healthRoutes);

app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/projects', projectInviteRoutes); // Mount project invite routes under /projects

app.use('/api/v1/:projectId', taskRoutes); // Mount task routes with projectId param

//note router will have :projectId

app.get('/', (req, res) => {
    res.send('Welcome to the Express.js server!');
});

// Global error handler - this catches all errors including ApiError
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    if (err.errors && err.errors.length > 0) {
        console.error('Validation errors:', JSON.stringify(err.errors, null, 2));
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
            data: err.data
        });
    }

    // Handle unexpected errors
    return res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        errors: [],
        data: null
    });
});
export default app;

/*
 * ===========================================================================================
 *                              NOTES — app.js
 * ===========================================================================================
 *
 * PURPOSE: Configures the Express application instance, setting up global middleware, routes, and error handling.
 * ROLE IN ARCHITECTURE: The core framework configuration layer. It assembles all the separate routing modules and middleware into a single cohesive web server.
 * 
 * IMPORTS:
 * - `express`: The core web framework.
 * - `dotenv`: Loads environment variables for configuration.
 * - `cors`: Middleware to enable Cross-Origin Resource Sharing.
 * - `cookie-parser`: Middleware to parse cookies attached to the client request object.
 * - `ApiError`: Custom error class used in the global error handler.
 * - Router modules (`authRoutes`, `healthRoutes`, etc.): The separated route definitions.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `app.use(express.json())` / `app.use(express.urlencoded())`: Parses incoming request bodies (JSON and URL-encoded) with a 16kb limit to prevent payload bloat.
 * - `app.use(cors())`: Configures CORS dynamically based on `process.env.CORS_ORIGIN`, allowing the frontend to communicate with the API while sending credentials (cookies).
 * - `app.use('/api/v1/...', router)`: Mounts the respective routers to their base URL paths, versioning the API.
 * - Global Error Handler `app.use((err, req, res, next))`: Catches all synchronous and asynchronous errors forwarded via `next(err)`. Formats them consistently using the structure defined in `ApiError`.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Imported by `src/index.js` which actually starts the server listening on a port.
 * - Outbound dependencies: Imports all routers and custom middleware to attach them to the Express instance.
 * 
 * DESIGN PATTERNS:
 * - Module Pattern: Keeps server configuration (`app.js`) separate from network binding (`index.js`), which makes the app easier to test using tools like Supertest without starting a real port.
 * - Middleware Chain Pattern: Requests flow sequentially through parsing, logging, CORS, routing, and finally error handling.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why limit JSON body parsing to '16kb'?
 *    Answer: It acts as a security measure against Denial of Service (DoS) attacks where a malicious client sends an enormous JSON payload to exhaust server memory.
 * 2. Why separate `app.js` and `index.js`?
 *    Answer: It's a standard Node.js best practice for testing. Testing libraries can import `app` and inject mock requests without dealing with port conflicts or database startup latency.
 * 3. Why does the global error handler have four arguments `(err, req, res, next)`?
 *    Answer: In Express, a middleware must have exactly four arguments for the framework to recognize it specifically as an error-handling middleware.
 */