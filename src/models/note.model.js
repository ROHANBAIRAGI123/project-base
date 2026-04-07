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