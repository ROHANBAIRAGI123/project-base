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

    test.todo('should return 400 when username is already taken (distinct from email conflict)');

    test.todo('should return 429 when registration is attempted more than 10 times from the same IP within 15 minutes');

    test.todo('should strip XSS payloads from username and email fields before processing');
});
