import request from 'supertest';
import app from '../../../src/app.js';

// GET /api/v1/auth/me  —  getCurrentUser (protected)

describe('GET /api/v1/auth/me', () => {
    it.todo('should return 200 with the authenticated user object (excluding sensitive fields)');

    it.todo('should return 401 when request is made without authentication');

    it.todo('should NOT expose password, refreshToken, or forgotPasswordToken in the response');
});

// PATCH /api/v1/auth/me  —  updateUserProfile (protected)
// Only username and fullname can be updated via this endpoint.

describe('PATCH /api/v1/auth/me', () => {
    it.todo('should return 200 and update username when a valid username is provided');

    it.todo('should return 200 and update fullname when a valid fullname is provided');

    it.todo('should return 200 when only one of username or fullname is provided (partial update)');

    it.todo('should return 409 when the new username is already taken by another user');

    it.todo('should return 401 when request is made without authentication');

    it.todo('should NOT expose sensitive fields in the updated user response');
});

// POST /api/v1/auth/delete-user  —  deleteUser (protected, requires password confirmation)

describe('POST /api/v1/auth/delete-user', () => {
    it.todo('should return 200 and delete the account when the correct password is provided');

    it.todo('should return 401 when the provided password is incorrect');

    it.todo('should return 401 when request is made without authentication');

    it.todo('should clear auth cookies after successful account deletion');

    it.todo('should remove the user record from the database after deletion');
});

// GET /api/v1/auth/get-all-users  —  getAllUsers (protected, authenticated users only)
// Note: this route currently only requires verifyJWT, not an admin role check.

describe('GET /api/v1/auth/get-all-users', () => {
    it.todo('should return 200 and an array of users for any authenticated user');

    it.todo('should return 401 when request is made without authentication');

    it.todo('should NOT expose password, refreshToken, or other sensitive fields in the user list');
});
