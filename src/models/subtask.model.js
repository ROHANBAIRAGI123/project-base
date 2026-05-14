import mongoose from "mongoose";
import {AvailableTaskPriorities,TaskPriorityEnum, TaskStatusEnum,AvailableTaskStatuses} from "../utils/constants.js"

const subTaskSchema = new mongoose.Schema({
    title: {
        required: true,
        type: String,
        trim: true,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    },
    description: {
        type: String,
        trim: true,  
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    priority:{
        type: String,
        enum: AvailableTaskPriorities,
        default: TaskPriorityEnum.LOW
    },
    status: {
        type: String,
        enum: AvailableTaskStatuses,
        default: TaskStatusEnum.TODO
    }
    
},{timestamps: true})


subTaskSchema.index({ project: 1, task: 1 });
subTaskSchema.index({ title: 1, task: 1 }, {unique: true});
export const SubTask = mongoose.model("SubTask", subTaskSchema);

/*
 * ===========================================================================================
 *                              NOTES — subtask.model.js
 * ===========================================================================================
 *
 * PURPOSE: Defines the schema for a SubTask, allowing tasks to be broken down into smaller, actionable steps.
 * ROLE IN ARCHITECTURE: Data layer (Model). Maps to the `subtasks` collection.
 * 
 * IMPORTS:
 * - `mongoose`: Core MongoDB ODM library.
 * - `constants.js`: Imports Enums for priorities and statuses.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `subTaskSchema.index({ project: 1, task: 1 })`: Optimizes queries that fetch all subtasks for a specific task within a project.
 * - `subTaskSchema.index({ title: 1, task: 1 }, {unique: true})`: Prevents duplicate subtask titles within the *same* parent task.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Used by `task.controllers.js` (which manages both tasks and subtasks).
 * - Outbound dependencies: References `Project`, `Task`, and `User` (createdBy).
 * 
 * DESIGN PATTERNS:
 * - Hierarchical Data Pattern (Parent Referencing): Instead of storing subtasks inside an array within the Task document, subtasks are their own documents referencing their parent Task. This prevents MongoDB 16MB document size limit issues.
 * - Denormalization for Query Performance: Includes a reference to `Project` even though it could be derived from the parent `Task`. This allows querying "all subtasks in a project" directly without a complex `$lookup` pipeline.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why is the `Project` reference included if the `Task` already belongs to a project?
 *    Answer: It's a strategic denormalization. By storing `project_id` on the subtask, we can easily query or filter subtasks at the project level without needing to `populate()` the parent task first, drastically improving read performance.
 * 2. What happens to SubTasks if the parent Task is deleted?
 *    Answer: Because they are separate documents, deleting a Task leaves orphaned SubTasks unless the application specifically deletes them. This should be handled in a `pre("remove")` hook on the Task model or explicitly in the controller.
 * 3. Why no `assignedTo` field on subtasks?
 *    Answer: Design choice. In this specific domain model, subtasks inherit the assignment of the parent task, keeping the data model simpler. If granular assignment was needed, an `assignedTo` field would be added here.
 */