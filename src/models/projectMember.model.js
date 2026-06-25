import mongoose from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const projectMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    role: {
      type: String,
      enum: AvailableUserRole,
      default: UserRolesEnum.MEMBER,
    },
  },
  { timestamps: true },
);

projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });

export const ProjectMember = mongoose.model(
  "ProjectMember",
  projectMemberSchema,
);

/*
 * ===========================================================================================
 *                              NOTES — projectMember.model.js
 * ===========================================================================================
 *
 * PURPOSE: Defines the many-to-many relationship mapping between Users and Projects, including the user's role within that specific project.
 * ROLE IN ARCHITECTURE: Data layer (Join/Pivot Model). Crucial for the Role-Based Access Control (RBAC) system.
 *
 * IMPORTS:
 * - `mongoose`: Core MongoDB ODM library.
 * - `AvailableUserRole`, `UserRolesEnum`: Defines the strict list of allowed roles (from `constants.js`).
 *
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `projectMemberSchema.index({ project: 1, user: 1 }, { unique: true })`:
 *   - What it does: Prevents a single user from being added to the same project more than once.
 *
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Used extensively by `permission.middleware.js` to verify access, and by project/member controllers.
 * - Outbound dependencies: References both `User` and `Project` collections.
 *
 * DESIGN PATTERNS:
 * - Pivot/Join Collection Pattern: In relational databases, this is a standard join table. In MongoDB, separating this out (rather than embedding an array of `{userId, role}` inside the Project document) avoids unbounded array issues and makes querying "What projects am I in?" extremely fast.
 *
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why use a separate collection for project members instead of embedding an array in the Project model?
 *    Answer: Embedding causes the Project document to grow infinitely as the team scales. Also, querying all projects for a specific user requires scanning every project array. A separate join collection scales perfectly and allows fast bidirectional indexing.
 * 2. What happens if a User is deleted? Does this record stay?
 *    Answer: In MongoDB, there are no strict foreign key constraints. If a user is deleted, this record becomes an "orphan". The application should handle this via a pre-remove hook on the User model, or handle null references gracefully when populating.
 * 3. Why is this model critical for security?
 *    Answer: It acts as the single source of truth for the `permission.middleware.js`. Modifying a user's role here instantly propagates their permission level across the entire project.
 */
