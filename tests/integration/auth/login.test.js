import request from 'supertest';
import app from '../../../src/app.js';

// How to use Supertest with cookies:
//   const res = await request(app).post('/api/v1/auth/login').send({ email, password });
//   expect(res.headers['set-cookie']).toBeDefined(); // access + refresh cookies
//
// Tip: Use the user.fixture.js helper to create a seeded user before calling login

describe('POST /api/v1/auth/login', () => {
    test.todo('should return 200 and set httpOnly cookies on valid credentials');

    test.todo('should return 401 when password is incorrect');

    test.todo('should return 401 when email does not exist');

    test.todo('should return 400 when email or password fields are missing');

    test.todo('should not expose the password or refreshToken in the response body');
});
