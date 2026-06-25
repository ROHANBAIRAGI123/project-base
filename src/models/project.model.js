import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalMembers: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

projectSchema.index({ createdBy: 1 });
projectSchema.index({ createdBy: 1, name: 1 }, { unique: true });

// Keep tasks normalized in Task collection and expose via virtual populate.
projectSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "project",
});

export const Project = mongoose.model("Project", projectSchema);

/*
 * ===========================================================================================
 *                              NOTES — project.model.js
 * ===========================================================================================
 *
 * PURPOSE: Defines the schema for a Project, the top-level organizational unit for tasks and team members.
 * ROLE IN ARCHITECTURE: Data layer (Model). Acts as the primary bounding context for permissions and content grouping.
 *
 * IMPORTS:
 * - `mongoose`: Core MongoDB ODM library.
 *
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `projectSchema.index({ createdBy: 1, name: 1 }, { unique: true })`:
 *   - What it does: Enforces a database-level constraint that a specific user cannot create two projects with the exact same name.
 * - `projectSchema.virtual("tasks", ...)`:
 *   - What it does: Sets up a virtual property. Instead of storing an array of Task IDs directly on the Project document (which could grow infinitely and hit the 16MB BSON limit), it instructs Mongoose on how to dynamically look up related tasks when requested.
 *
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Used by `project.controllers.js`. Referenced by `ProjectMember`, `ProjectInvitation`, `Task`, and `Note` models.
 * - Outbound dependencies: `createdBy` references the `User` model.
 *
 * DESIGN PATTERNS:
 * - Normalized One-to-Many Relationship: Instead of embedding tasks in the project, tasks hold a reference to the project. The Virtual Populate pattern bridges this gap for easy querying.
 *
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why use a virtual field for `tasks` instead of an array of ObjectIds?
 *    Answer: MongoDB has a 16MB document size limit. An array of ObjectIds (`[ObjectId, ObjectId, ...]`) is an unbounded array pattern that can eventually break the application as the project grows. Virtuals solve this by querying the `Task` collection where `project_id = this._id`.
 * 2. Why are `toJSON: { virtuals: true }` and `toObject: { virtuals: true }` required?
 *    Answer: By default, Mongoose does not include virtual properties when converting a document to JSON (which happens when sending a response with `res.json()`). These flags force inclusion.
 * 3. What does the compound index `{ createdBy: 1, name: 1 }, { unique: true }` achieve?
 *    Answer: It prevents the same user from having duplicate project names, while allowing two different users to both have a project named "Website Redesign".
 */
