# Core System Workflows

This document outlines the step-by-step technical flows for the primary business processes in the application.

## 1. User Registration & Onboarding Flow

1. **Client Request**: User submits `POST /api/v1/auth/register` with `{ username, email, password, fullname }`.
2. **Security Gauntlet**:
   - `sanitizeAndValidateInput`: Strips XSS and trims strings.
   - `validate`: Checks against `userRegisterSchema` (e.g., password length > 6).
3. **Controller Processing**:
   - Check DB for existing `username` or `email` (`$or` query). Throw 400 if duplicate.
   - Create new `User` document.
   - Mongoose `pre("save")` hook triggers automatically -> generates salt -> hashes password.
4. **Token Generation**: Generate a secure 20-byte hex `emailVerificationToken`. Store its SHA-256 hash in DB.
5. **Email Dispatch**: Nodemailer sends an email containing the raw token appended to an accept link.
6. **Response**: Return 201 Created. User cannot log in yet (`isEmailVerified = false`).

## 2. Project Creation & Member Assignment

1. **Client Request**: Authenticated user submits `POST /api/v1/projects/` with `{ name, description }`.
2. **Controller Processing**:
   - Insert new `Project` into DB. `createdBy` is set to `req.user._id`.
   - Insert new `ProjectMember` record linking `req.user._id`, `project._id`, and setting role to `ADMIN`.
3. **Response**: Return the newly created project data.

## 3. Project Invitation Lifecycle

1. **Send Invite**:
   - Project Admin submits `POST /api/v1/projects/:projectId/invite`.
   - Controller checks if user is already a member or already has a pending invite.
   - Creates `ProjectInvitation` document with status `pending`. Generates token, stores hash.
   - Sends email with Accept/Reject links.
2. **Accept Invite**:
   - User clicks email link: `GET /api/v1/invitations/accept/:token`.
   - Controller hashes incoming token, queries DB for pending invite.
   - Creates `ProjectMember` record based on invite data.
   - Increments Project `totalMembers` counter.
   - Updates Invitation status to `accepted`.

## 4. Task Management Flow

1. **Client Request**: `POST /api/v1/projects/:projectId/task/`
2. **RBAC Check**: Route executes `checkProjectPermission([ADMIN, PROJECT_ADMIN])`. If the requesting user is only a `MEMBER`, request is aborted with 403 Forbidden.
3. **Controller**:
   - Validates the `projectId` exists.
   - Creates `Task` document. `assignedBy` = `req.user._id`. `assignedTo` is optional.
4. **Deletion**:
   - If an admin deletes the task, the controller explicitly deletes all `SubTask` documents referencing that `taskId` to prevent database bloat, then deletes the Task itself.
