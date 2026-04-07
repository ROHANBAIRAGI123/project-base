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