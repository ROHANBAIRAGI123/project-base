import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Note from "../models/note.model.js";
import { NotesStatusEnum } from "../utils/constants.js";

export const createNote = asyncHandler(async (req, res) => {});

export const getNotes = asyncHandler(async (req, res) => {});

export const getNoteById = asyncHandler(async (req, res) => {});

export const updateNote = asyncHandler(async (req, res) => {});

export const deleteNote = asyncHandler(async (req, res) => {});

export const changeNoteStatus = asyncHandler(async (req, res) => {});

/*
 * ===========================================================================================
 *                              NOTES — note.controllers.js
 * ===========================================================================================
 *
 * PURPOSE: Stub controllers for the upcoming Notes feature.
 * ROLE IN ARCHITECTURE: Controller layer.
 * 
 * IMPORTS:
 * - Standard utilities and the `Note` model.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - All functions are currently empty async handlers awaiting implementation.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: `note.routes.js`.
 * 
 * DESIGN PATTERNS:
 * - Interface Stubbing: Defining the function signatures and exports before the internal logic is written allows the routing layer to be hooked up without crashing.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. How would you implement `getNotes` considering the `status` (PERSONAL vs SHARED) field?
 *    Answer: I would construct a query that finds all notes for the given `projectId` where the `status` is 'SHARED', OR (`$or`) where the `status` is 'PERSONAL' and the `user` matches `req.user._id`.
 */