import mongoose from "mongoose";
import {AvailableTaskPriorities,TaskPriorityEnum, TaskStatusEnum,AvailableTaskStatuses} from "../utils/constants.js"

const taskSchema = new mongoose.Schema({
    title: {
        required: true,
        type: String,
        trim: true,
        unique: true,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    description: {
        type: String,
        trim: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    assignedBy: {
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
    },
    isCompleted: {
        type: Boolean,
        default: false,
    }
    
},{timestamps: true})

export const task = mongoose.model("Task", taskSchema);