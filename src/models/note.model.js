import mongoose from "mongoose";
import {NotesStatusEnum} from "../utils/constants.js"

const noteSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 100,
    },
    content: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 500,
    },
    status: {
        type: String, 
        enum: [NotesStatusEnum.PERSONAL, NotesStatusEnum.SHARED],
        default: NotesStatusEnum.PERSONAL,
    }

},{timestamps: true})

export const Note = mongoose.model("Note",noteSchema)

/*
 * ===========================================================================================
 *                              NOTES — note.model.js
 * ===========================================================================================
 *
 * PURPOSE: Defines the schema for Notes attached to a Project, allowing users to keep personal or shared project documentation.
 * ROLE IN ARCHITECTURE: Data layer (Model).
 * 
 * IMPORTS:
 * - `mongoose`: Core MongoDB ODM library.
 * - `NotesStatusEnum`: To distinguish between personal and shared notes.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - (No complex methods or hooks. Just a straightforward schema.)
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Used by `note.controllers.js`.
 * - Outbound dependencies: References `User` (the author) and `Project` (the context).
 * 
 * DESIGN PATTERNS:
 * - Contextual Content Pattern: Notes don't exist in isolation; they are heavily bound to a specific Project context.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. What does the `status` enum (PERSONAL vs SHARED) achieve?
 *    Answer: It acts as an inline permission flag. When fetching notes for a project, the query can return all SHARED notes for the team, plus any PERSONAL notes where `user_id` matches the current request user.
 * 2. Why limit content to 500 characters (`maxlength: 500`)?
 *    Answer: To ensure the feature acts as "Notes" (quick thoughts) rather than a full document management system, keeping database size small and predictable.
 * 3. What index would you add to this schema for better read performance?
 *    Answer: An index on `{ project: 1, user: 1, status: 1 }` would be highly beneficial, as the most common query will be finding all shared notes in a project, or personal notes for a specific user in a project.
 */