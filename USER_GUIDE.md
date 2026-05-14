# API Integration & User Guide

Welcome to the Project Camp API. This guide explains how frontend clients and external services should interact with the system.

## Base URL
All API endpoints are prefixed with the current version:
`http://localhost:8000/api/v1`

## Authentication

This API uses a dual-token system (Access + Refresh Tokens) for maximum security and seamless user experience.

### Acquiring Tokens
Send credentials to `/auth/login`. On success, the server responds with:
1. Two `httpOnly` secure cookies (managed automatically by browsers).
2. A JSON payload containing the tokens (for mobile/native clients).

### Accessing Protected Routes
If you are a web browser client, simply ensure `withCredentials: true` is set in Axios or `credentials: 'include'` in Fetch. The cookies will be sent automatically.

If you are a mobile/external client, attach the Access Token to the HTTP Headers:
`Authorization: Bearer <your_access_token>`

### Handling Expirations (Token Rotation)
Access tokens expire quickly (e.g., 15 minutes). If an API request returns a `401 Unauthorized` with the message "jwt expired":
1. Call `POST /auth/refresh-access-token`.
2. The server will issue a new Access and Refresh token.
3. Retry your original failed request with the new tokens.

## Common Workflows

### 1. Setting up a Project
1. Create a project: `POST /projects`
2. Invite team members: `POST /projects/:projectId/invite` (requires their user ID).
3. They will receive an email to accept.

### 2. Managing Tasks
Tasks are strictly scoped to projects.
- **Create**: `POST /projects/:projectId/task`
- **List**: `GET /projects/:projectId/task`
- **Breakdown**: Add subtasks using `POST /projects/:projectId/task/:taskId/subtasks`.

### 3. Permissions Summary
- **Admin**: The creator. Can delete the project, change member roles, and do everything a Project Admin can do.
- **Project Admin**: Can manage tasks, invite users, and remove members.
- **Member**: Can view projects and tasks, and complete subtasks. Cannot modify project settings or delete tasks.

## Standardized Responses

The API always responds with a consistent envelope structure, making client-side parsing predictable.

**Success (200/201):**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Operation successful",
  "success": true
}
```

**Error (4xx/5xx):**
```json
{
  "statusCode": 400,
  "message": "Validation Error",
  "errors": [
    "Password must be at least 6 characters"
  ],
  "success": false,
  "stack": "..." // Only present in development mode
}
```
