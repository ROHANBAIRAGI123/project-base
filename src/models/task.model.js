import mongoose from "mongoose";
import {AvailableTaskPriorities,TaskPriorityEnum, TaskStatusEnum,AvailableTaskStatuses} from "../utils/constants.js"

const taskSchema = new mongoose.Schema({
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
        ref: "User"
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
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

taskSchema.index({ project: 1, title: 1 }, { unique: true });

export const Task = mongoose.model("Task", taskSchema);