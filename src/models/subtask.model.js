import mongoose from "mongoose";
import {AvailableTaskPriorities,TaskPriorityEnum, TaskStatusEnum,AvailableTaskStatuses} from "../utils/constants.js"

const subTaskSchema = new mongoose.Schema({
    title: {
        required: true,
        type: String,
        trim: true,
        unique: true,
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
    },
    isCompleted : {
        type: Boolean,
        default: false,
    }
    
},{timestamps: true})

export const SubTask = mongoose.model("SubTask", subTaskSchema);