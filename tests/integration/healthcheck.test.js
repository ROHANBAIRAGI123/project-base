import request from "supertest";
import app from "../../src/app.js";

// GET /api/v1/healthcheck  (or wherever it's mounted — check app.js)
// Liveness probe: verifies the Express process is alive and responding.

describe("GET /api/v1/healthcheck", () => {
  it.todo(
    "should return 200 with a success message when the server is running",
  );

  it.todo("should not require authentication");

  it.todo(
    "should return a consistent JSON shape with statusCode, data, and message fields",
  );
});
