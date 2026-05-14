import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './db/index.js';
dotenv.config();

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
    console.log(`Server is running on link http://localhost:${PORT}`);
});
}).catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
});

/*
 * ===========================================================================================
 *                              NOTES — index.js (Entry Point)
 * ===========================================================================================
 *
 * PURPOSE: The main execution entry point of the Node.js application. Connects to the database and starts the server.
 * ROLE IN ARCHITECTURE: Bootstrapper. It initializes external dependencies (like DB) before opening the application to network traffic.
 * 
 * IMPORTS:
 * - `dotenv`: Configures environment variables immediately at startup.
 * - `app.js`: The fully configured Express application.
 * - `db/index.js`: The database connection logic.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `connectDB().then(...).catch(...)`: Attempts to establish a connection to MongoDB.
 *   - On success: Starts the Express server listening on the configured PORT.
 *   - On failure: Logs the error and terminates the process with `process.exit(1)`.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: This is the root file executed by Node (`node src/index.js`).
 * - Outbound dependencies: Depends on `connectDB` to establish infrastructure, and `app.js` for the actual server logic.
 * 
 * DESIGN PATTERNS:
 * - Graceful Startup Pattern: Ensures that the HTTP server only starts accepting requests *after* the database connection is successfully established, preventing early requests from failing due to missing DB context.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why `require('dotenv').config()` at the very top?
 *    Answer: Environment variables must be loaded into `process.env` before any other module (like `app.js` or `db/index.js`) is imported, as those modules might rely on those variables during their initialization phase.
 * 2. What happens if the database connection fails here?
 *    Answer: The `.catch` block catches the rejection, logs it, and forces the Node process to exit (`process.exit(1)`).
 * 3. Why avoid putting route definitions directly in this file?
 *    Answer: Separation of concerns. Keeping this file strictly for bootstrapping and `app.js` for app configuration makes the codebase significantly easier to navigate and test.
 */
