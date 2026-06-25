import mongoose from "mongoose";
import {
  AvailableTaskPriorities,
  TaskPriorityEnum,
  TaskStatusEnum,
  AvailableTaskStatuses,
} from "../utils/constants.js";

const taskSchema = new mongoose.Schema(
  {
    title: {
      required: true,
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priority: {
      type: String,
      enum: AvailableTaskPriorities,
      default: TaskPriorityEnum.LOW,
    },
    status: {
      type: String,
      enum: AvailableTaskStatuses,
      default: TaskStatusEnum.TODO,
    },
  },
  { timestamps: true },
);

taskSchema.index({ project: 1, title: 1 }, { unique: true });

export const Task = mongoose.model("Task", taskSchema);

/*
 * ===========================================================================================
 *                              NOTES — task.model.js
 * ===========================================================================================
 *
 * PURPOSE: Defines the schema for a Task, the primary unit of work within a Project.
 * ROLE IN ARCHITECTURE: Data layer (Model). Maps to the `tasks` collection and enforces data integrity for work items.
 *
 * IMPORTS:
 * - `mongoose`: Core MongoDB ODM library.
 * - `constants.js`: Imports Enums for priorities and statuses to ensure strict adherence to allowed states.
 *
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `taskSchema.index({ project: 1, title: 1 }, { unique: true })`:
 *   - What it does: Enforces a compound unique index. No two tasks within the *same* project can have the exact same title.
 *
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Used by `task.controllers.js` for CRUD operations. Referenced via virtual populate in `Project` model.
 * - Outbound dependencies: References `Project` (the parent), `User` (assignedTo), and `User` (assignedBy).
 *
 * DESIGN PATTERNS:
 * - Normalized References: Stores ObjectIds pointing to `Project` and `User` rather than duplicating their data, ensuring data consistency if a user's name changes.
 * - Default State Pattern: Uses `default: TaskStatusEnum.TODO` to simplify creation logic in the controller.
 *
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why are `assignedTo` and `assignedBy` separated?
 *    Answer: For accountability and audit trails. A Project Admin (`assignedBy`) can create a task for a Member (`assignedTo`). If a task is overdue, we know who is responsible for doing it AND who is responsible for managing it.
 * 2. Why enforce unique titles per project instead of globally?
 *    Answer: It's very common to have a task named "Setup Repository" across hundreds of different projects. Making it globally unique would break the application.
 * 3. Why is `assignedTo` not `required: true`?
 *    Answer: Tasks can be created in a backlog without being assigned to a specific person immediately. They can be claimed or assigned later during a sprint planning phase.
 */
