import request from 'supertest';
import app from '../../../src/app.js';

// Invitation routes are mounted at /api/v1/projects (check app.js)
// Full paths (based on projectInvite.routes.js):
//   POST   /api/v1/projects/:projectId/invite         → sendProjectInvitation
//   GET    /api/v1/projects/accept/:invitationToken    → acceptProjectInvitation  (PUBLIC — no auth)
//   GET    /api/v1/projects/reject/:invitationToken    → rejectProjectInvitation  (PUBLIC — no auth)
//   GET    /api/v1/projects/:projectId/invitations     → getProjectInvitations
//   GET    /api/v1/projects/user/pending               → getUserPendingInvitations
//   POST   /api/v1/projects/:invitationId/resend       → resendProjectInvitation
//   DELETE /api/v1/projects/:invitationId/cancel       → cancelProjectInvitation
//
// KEY DESIGN NOTES:
//   - accept/reject are PUBLIC GET routes (no verifyJWT) — they are clicked from emails
//   - resend/cancel do their own role check inside the controller (not via checkProjectPermission)
//     because they take :invitationId, not :projectId

describe('POST /api/v1/projects/:projectId/invite — Send Invitation', () => {
    test.todo('should return 201 when Admin sends an invitation to a valid existing user');

    test.todo('should return 201 when Project Admin sends an invitation');

    test.todo('should return 403 when a Member tries to send an invitation');

    test.todo('should return 401 when request is made without authentication');

    test.todo('should return 404 when the invited userId does not exist in the system');

    test.todo('should return 400 when the user is already a member of the project');

    test.todo('should return 400 when there is already a pending invitation for this user');
});

describe('GET /api/v1/projects/accept/:invitationToken — Accept Invitation', () => {
    test.todo('should return 200 and add the user to ProjectMember when token is valid');

    test.todo('should return 400 when the invitation token is invalid or tampered');

    test.todo('should return 400 when the invitation token has expired');

    test.todo('should return 400 when the invited user is already a member of the project');

    test.todo('should mark invitation status as "accepted" in the database after acceptance');
});

describe('GET /api/v1/projects/reject/:invitationToken — Reject Invitation', () => {
    test.todo('should return 200 and mark invitation as "rejected" when token is valid');

    test.todo('should return 400 when the invitation token is invalid');

    test.todo('should return 400 when the invitation token has expired');

    test.todo('should NOT add the user to ProjectMember after rejection');
});

describe('GET /api/v1/projects/:projectId/invitations — Get Project Invitations', () => {
    test.todo('should return 200 and list all invitations for a project when Admin requests');

    test.todo('should return 200 when Project Admin requests the list');

    test.todo('should return 403 when a Member tries to view project invitations');

    test.todo('should return 401 when request is made without authentication');

    test.todo('should include invitedUser and invitedBy user details in the response (aggregation check)');
});

describe('GET /api/v1/projects/user/pending — Get My Pending Invitations', () => {
    test.todo('should return 200 and list all pending invitations for the authenticated user');

    test.todo('should return an empty array when the user has no pending invitations');

    test.todo('should return 401 when request is made without authentication');

    test.todo('should include project name and invitedBy details in the response');
});

describe('POST /api/v1/projects/:invitationId/resend — Resend Invitation', () => {
    test.todo('should return 200 when Admin resends a pending invitation');

    test.todo('should return 403 when a Member tries to resend an invitation');

    test.todo('should return 400 when the invitation status is not "pending" (already accepted/rejected)');

    test.todo('should return 404 when invitationId does not exist');
});

describe('DELETE /api/v1/projects/:invitationId/cancel — Cancel Invitation', () => {
    test.todo('should return 200 when Admin cancels a pending invitation');

    test.todo('should return 403 when a Member tries to cancel an invitation');

    test.todo('should return 400 when the invitation is not in "pending" status');

    test.todo('should return 404 when invitationId does not exist');

    test.todo('should delete the invitation record from the database after cancellation');
});
