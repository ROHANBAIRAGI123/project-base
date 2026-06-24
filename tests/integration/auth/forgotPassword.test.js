import request from 'supertest';
import app from '../../../src/app.js';

// Note: These tests should NOT actually send emails.
// The nodemailer transport should be mocked or use a test environment
// that silently drops emails (e.g. set EMAIL_HOST to a fake SMTP)

describe('POST /api/v1/auth/forgot-password', () => {
    test.todo('should return 200 when a valid registered email is submitted');

    test.todo('should return 200 even when email does not exist (security: no user enumeration)');

    test.todo('should return 400 when email field is missing or malformed');
});

describe('POST /api/v1/auth/reset-password/:resetToken', () => {
    test.todo('should return 200 and update the password when reset token is valid');

    test.todo('should return 400 when reset token has expired');

    test.todo('should return 400 when reset token does not exist in the database');

    test.todo('should return 400 when new password does not meet requirements');

    test.todo('should return 400 when newPassword and confirmPassword do not match');

    test.todo('should clear forgotPasswordToken and forgotPasswordTokenExpiry after a successful reset');
});
