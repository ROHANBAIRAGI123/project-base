import request from 'supertest';
import app from '../../../src/app.js';

// How to use Supertest:
//   const res = await request(app).post('/api/v1/auth/register').send({ ... });
//   expect(res.status).toBe(201);
//   expect(res.body.data).toHaveProperty('user');

describe('POST /api/v1/auth/register', () => {
    test.todo('should register a new user and return 201 with user data');

    test.todo('should return 409 if the email is already registered');

    test.todo('should return 400 if email format is invalid');

    test.todo('should return 400 if password is too short');

    test.todo('should return 400 if required fields (username, email, password) are missing');

    test.todo('should not return the password field in the response body');
});
