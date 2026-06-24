import { describe, it } from 'vitest';
// Import from: import { verifyJWT } from '../../../src/middlewares/auth.middleware.js'
// The middleware reads the token from req.cookies.accessToken OR req.headers.authorization (Bearer)

describe('verifyJWT middleware — authentication gatekeeper', () => {
    it.todo('should call next() and attach req.user when a valid access token is provided via cookie');

    it.todo('should call next() and attach req.user when a valid access token is provided via Authorization header');

    it.todo('should call next(err) with 401 when no token is provided in either cookie or header');

    it.todo('should call next(err) with 401 when the token signature is invalid (tampered)');

    it.todo('should call next(err) with 401 when the token has expired');

    it.todo('should call next(err) with 401 when the token references a user that no longer exists in the DB');

    it.todo('should NOT expose password or refreshToken on the req.user object after successful verification');
});

describe('checkProjectPermission middleware — project-scoped RBAC', () => {
    it.todo('should call next() when the user has one of the allowed roles in the project');

    it.todo('should call next(err) with 403 when the user is not a member of the project at all');

    it.todo('should call next(err) with 403 when the user is a member but does not have the required role');

    it.todo('should attach req.projectMember to the request on successful authorization');

    it.todo('should correctly enforce ADMIN-only restriction when only ADMIN is in the roles array');

    it.todo('should allow access when the roles array includes MEMBER and the user is a MEMBER');
});
