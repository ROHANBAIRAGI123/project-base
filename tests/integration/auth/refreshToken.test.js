import request from "supertest";
import app from "../../../src/app.js";

// How refresh token works:
//   The refresh token is stored in an httpOnly cookie named `refreshToken`
//   Send it back in the Cookie header to get a new access token
//
//   const loginRes = await request(app).post('/api/v1/auth/login').send({...});
//   const cookies = loginRes.headers['set-cookie'];
//   const res = await request(app).post('/api/v1/auth/refresh-access-token').set('Cookie', cookies);

describe("POST /api/v1/auth/refresh-access-token", () => {
  test.todo(
    "should return 200 and issue a new access token cookie when refresh token is valid",
  );

  test.todo("should return 401 when no refresh token cookie is provided");

  test.todo("should return 401 when refresh token is invalid or tampered");

  test.todo(
    "should return 401 when refresh token has been rotated (used after a new one was issued)",
  );

  test.todo(
    "should return 401 when refresh token is expired (JWT expiry exceeded)",
  );

  test.todo(
    "should set new accessToken and refreshToken cookies on successful token refresh",
  );
});
