import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ProjectMember } from "../models/projectMember.model.js";


const checkProjectPermission = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user._id;

    const projectMember = await ProjectMember.findOne({ project: projectId, user: userId });

    if (!projectMember) {
      throw new ApiError(403, "You do not have permission to access this project");
    }
    if (!roles.includes(projectMember.role)) {
      throw new ApiError(403, "You do not have the required role to access this project");
    }

    req.projectMember = projectMember;
    next();
  });
};

export { checkProjectPermission };

/*
 * ===========================================================================================
 *                              NOTES — permission.middleware.js
 * ===========================================================================================
 *
 * PURPOSE: Implements Role-Based Access Control (RBAC) specifically scoped to individual projects.
 * ROLE IN ARCHITECTURE: Authorization layer. Follows authentication (verifying WHO you are) to determine WHAT you are allowed to do.
 * 
 * IMPORTS:
 * - `ApiError`, `asyncHandler`: Error handling.
 * - `ProjectMember` model: The join table that links users to projects with specific roles.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `checkProjectPermission(roles = [])`: A higher-order middleware function (factory).
 *   - What it does: Takes an array of allowed roles (e.g., `['admin', 'project_admin']`). Extracts `projectId` from URL params and `userId` from `req.user`. Checks if the user is a member of that project. Checks if their role is in the allowed `roles` array. Attaches the membership record to `req.projectMember`.
 *   - Parameters: `roles` (Array of strings). Returns an Express middleware function.
 *   - Edge cases: Throws 403 if the user isn't in the project or lacks the required role.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Used in project-scoped routes (`task.routes.js`, `project.routes.js`). MUST be placed *after* `verifyJWT` because it relies on `req.user`.
 * - Outbound dependencies: Queries the `ProjectMember` collection.
 * 
 * DESIGN PATTERNS:
 * - Middleware Factory Pattern: A function that returns a middleware function. This allows passing configuration (the roles array) when defining the route.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why is `req.projectMember = projectMember` useful?
 *    Answer: It caches the membership record so that downstream controllers don't have to query the database again to figure out the user's role or membership details.
 * 2. Why is authorization scoped to projects instead of being a global user property?
 *    Answer: In a multi-tenant system like this, a user might be an 'Admin' in Project A, but merely a 'Member' in Project B. Global roles would not allow for this granularity.
 * 3. What is the difference between Authentication (401) and Authorization (403)?
 *    Answer: Authentication (401) means the system doesn't know who you are (missing/invalid token). Authorization (403) means the system knows exactly who you are, but you aren't allowed to do that action.
 */