import request from 'supertest';
import app from '../../../src/app.js';

describe('PATCH /api/v1/auth/change-password', () => {
    test.todo('should return 200 when authenticated user provides correct old password');

    test.todo('should return 401 when old password is incorrect');

    test.todo('should return 401 when request is made without authentication');

    test.todo('should return 400 when new password does not meet minimum length requirements');

    test.todo('should invalidate existing sessions after password change');
});
