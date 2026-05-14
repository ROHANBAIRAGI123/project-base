import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;

/*
 * ===========================================================================================
 *                              NOTES — index.js (Database)
 * ===========================================================================================
 *
 * PURPOSE: Establishes the connection to the MongoDB database using Mongoose.
 * ROLE IN ARCHITECTURE: Infrastructure layer. Acts as the gateway between the Node.js application and the persistent data store.
 * 
 * IMPORTS:
 * - `mongoose`: The official MongoDB object modeling tool designed to work in an asynchronous environment.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `connectDB()`: Asynchronous function that initiates the DB connection.
 *   - Parameters: None.
 *   - Returns: Promise (void).
 *   - Side effects: Connects to external MongoDB instance. Exits the Node process (process.exit(1)) if the connection fails.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Imported and executed by `src/index.js` during server startup.
 * - Outbound dependencies: Connects to the MongoDB server specified in `process.env.MONGO_URI`.
 * 
 * DESIGN PATTERNS:
 * - Singleton Connection: Mongoose manages a default connection pool globally. Calling `connect()` establishes this shared pool used by all models.
 * - Fail-Fast: If the database is unreachable at startup, the app immediately crashes rather than running in a degraded state.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why do we exit the process `process.exit(1)` on connection failure?
 *    Answer: An API that depends on a database cannot function without it. Failing fast prevents undefined behaviors and allows process managers (like Docker or PM2) to restart the container/process.
 * 2. Why is Mongoose used instead of the native MongoDB driver?
 *    Answer: Mongoose provides schema validation, middleware (hooks), and a structured approach to modeling relationships, which accelerates development compared to the schemaless native driver.
 */