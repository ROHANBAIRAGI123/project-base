import request from "supertest";
import app from "../../../src/app.js";

// How to test a protected route:
//   1. Login to get cookies:    const loginRes = await request(app).post('/api/v1/auth/login').send({...});
//   2. Extract cookie header:   const cookies = loginRes.headers['set-cookie'];
//   3. Call protected route:    const res = await request(app).post('/api/v1/auth/logout').set('Cookie', cookies);

describe("POST /api/v1/auth/logout", () => {
  test.todo("should return 200 and clear auth cookies for authenticated user");

  test.todo("should return 401 when no access token is provided");

  test.todo("should invalidate the refresh token in the database on logout");
});
