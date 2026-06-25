import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectMember.model.js";
import { Note } from "../models/note.model.js";
import { NotesStatusEnum } from "../utils/constants.js";
import mongoose from "mongoose";

// create note
export const createNote = asyncHandler(async (req, res) => {
  const { title, content, status } = req.body;
  const { projectId } = req.params;

  const note = await Note.create({
    title,
    content,
    project: projectId,
    user: req.user._id,
    status: status || NotesStatusEnum.PERSONAL,
  });

  res.status(201).json(new ApiResponse(201, note, "Note created successfully"));
});

// get notes for a project
export const getNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const notes = await Note.find({
    project: projectId,
    $or: [{ status: NotesStatusEnum.SHARED }, { user: req.user._id }],
  }).populate("user", "fullname email");

  res
    .status(200)
    .json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

// get note by id
export const getNoteById = asyncHandler(async (req, res) => {
  const { noteId, projectId } = req.params;

  const note = await Note.findOne({
    _id: new mongoose.Types.ObjectId(noteId),
    project: projectId,
    $or: [{ status: NotesStatusEnum.SHARED }, { user: req.user._id }],
  }).populate("user", "fullname email");

  if (!note) {
    throw new ApiError(
      404,
      "Note not found or you do not have permission to view it",
    );
  }

  res.status(200).json(new ApiResponse(200, note, "Note fetched successfully"));
});

// update note
export const updateNote = asyncHandler(async (req, res) => {
  const { noteId, projectId } = req.params;
  const { title, content, status } = req.body;

  const noteObjectId = new mongoose.Types.ObjectId(noteId);

  // Ownership check — only the note owner can update
  const existingNote = await Note.findOne({
    _id: noteObjectId,
    project: projectId,
  }).select("_id user");
  if (!existingNote) {
    throw new ApiError(404, "Note not found");
  }
  if (existingNote.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this note");
  }

  const updatedNote = await Note.findOneAndUpdate(
    { _id: noteObjectId, project: projectId, user: req.user._id },
    {
      ...(title && { title }),
      ...(content && { content }),
      ...(status && { status }),
    },
    { new: true, runValidators: true },
  );

  res
    .status(200)
    .json(new ApiResponse(200, updatedNote, "Note updated successfully"));
});

// delete note
export const deleteNote = asyncHandler(async (req, res) => {
  const { noteId, projectId } = req.params;
  const noteObjectId = new mongoose.Types.ObjectId(noteId);

  // Ownership check — only the note owner can delete
  const existingNote = await Note.findOne({
    _id: noteObjectId,
    project: projectId,
  }).select("_id user");
  if (!existingNote) {
    throw new ApiError(404, "Note not found");
  }
  if (existingNote.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this note");
  }

  await Note.findOneAndDelete({
    _id: noteObjectId,
    project: projectId,
    user: req.user._id,
  });

  res.status(200).json(new ApiResponse(200, null, "Note deleted successfully"));
});

// change note status (PERSONAL <-> SHARED)
export const changeNoteStatus = asyncHandler(async (req, res) => {
  const { noteId, projectId } = req.params;
  const { status } = req.body;
  const noteObjectId = new mongoose.Types.ObjectId(noteId);

  // Ownership check — only the note owner can change visibility
  const existingNote = await Note.findOne({
    _id: noteObjectId,
    project: projectId,
  }).select("_id user status");
  if (!existingNote) {
    throw new ApiError(404, "Note not found");
  }
  if (existingNote.user.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to change the status of this note",
    );
  }
  if (existingNote.status === status) {
    throw new ApiError(400, `Note status is already '${status}'`);
  }

  const updatedNote = await Note.findOneAndUpdate(
    { _id: noteObjectId, project: projectId, user: req.user._id },
    { status },
    { new: true, runValidators: true },
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedNote, "Note status updated successfully"),
    );
});

/*
 * ===========================================================================================
 *                              NOTES — note.controllers.js
 * ===========================================================================================
 *
 * PURPOSE: Business logic for Note CRUD and visibility control within a Project.
 * ROLE IN ARCHITECTURE: Controller layer.
 *
 * VALIDATION RESPONSIBILITY SPLIT:
 * - Router layer  : ObjectId format, required fields, enum values, field lengths (Zod schemas).
 * - Auth layer    : verifyJWT confirms req.user is populated.
 * - RBAC layer    : checkProjectPermission confirms user is a project member.
 * - Controller    : Ownership checks (only note.user can mutate), business-rule 404/403 guards,
 *                   no-op detection (same status re-set).
 *
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `createNote`       : Creates note; sets `user` from req.user._id. No extra checks needed —
 *                        middleware has already validated input and confirmed project membership.
 * - `getNotes`         : Returns SHARED notes for the project + PERSONAL notes owned by the user.
 * - `getNoteById`      : Same visibility rule as getNotes, scoped to a single document.
 * - `updateNote`       : Pre-flight ownership check before atomic findOneAndUpdate.
 * - `deleteNote`       : Pre-flight ownership check before deletion.
 * - `changeNoteStatus` : Ownership check + no-op guard (prevents redundant DB write).
 *
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: `note.routes.js`.
 * - Outbound dependencies: `Note` model, `mongoose` (for ObjectId construction only).
 *
 * DESIGN PATTERNS:
 * - Separation of Concerns: Validation/auth/RBAC handled in middleware; controller focuses
 *   purely on ownership and data operations.
 * - Pre-flight Check: Fetch-then-mutate pattern for ownership (findOne → check owner → update)
 *   prevents unauthorized blind writes.
 * - Atomic Updates: `findOneAndUpdate` with `{ user: req.user._id }` in the filter acts as a
 *   server-side ownership guard even if the pre-flight were somehow bypassed.
 *
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why keep ownership checks here instead of middleware?
 *    Answer: Ownership is business logic, not infrastructure. A generic permission middleware
 *    cannot know which DB record "belongs to" the current user — that requires a query.
 * 2. Why does `findOneAndUpdate` also include `user: req.user._id` in the filter?
 *    Answer: Defense-in-Depth. If the pre-flight ownership check were skipped due to a bug,
 *    the update filter itself ensures the operation silently fails for non-owners.
 * 3. Why is the `try/catch` around delete removed compared to the task controller?
 *    Answer: Notes have no child documents to cascade-delete (unlike Tasks → Subtasks).
 *    `asyncHandler` already wraps every controller in a try/catch and forwards errors to
 *    the global error handler, so an explicit try/catch adds no value here.
 */
