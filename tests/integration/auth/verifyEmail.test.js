import request from "supertest";
import app from "../../../src/app.js";

// GET /api/v1/auth/verify-email/:verificationToken
// Token is generated on registration, hashed with SHA-256, and stored in the DB.
// The raw token is embedded in the verification link sent via email.

describe("GET /api/v1/auth/verify-email/:verificationToken", () => {
  it.todo(
    "should return 200 and set isEmailVerified to true when token is valid",
  );

  it.todo(
    "should return 400 when the token has already been used (already verified)",
  );

  it.todo(
    "should return 400 when the token does not match any user in the database",
  );

  it.todo("should return 400 when the verification token has expired");

  it.todo(
    "should clear emailVerificationToken and emailVerificationTokenExpiry fields after successful verification",
  );

  it.todo("should allow login after successful email verification");
});

// POST /api/v1/auth/send-verification-email  (protected — requires verifyJWT)
// Resends a new verification email for users who never received or lost the first one.

describe("POST /api/v1/auth/send-verification-email", () => {
  it.todo(
    "should return 200 and send a new verification email for an unverified authenticated user",
  );

  it.todo(
    "should return 400 when the authenticated user email is already verified",
  );

  it.todo("should return 401 when request is made without authentication");

  it.todo(
    "should overwrite the previous verification token in the database with a fresh one",
  );
});
