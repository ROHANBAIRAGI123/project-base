import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import  {Project}  from "../models/project.model.js";
import  {ProjectMember}  from "../models/projectMember.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { UserRolesEnum } from "../utils/constants.js";
import { Task } from "../models/task.model.js";
import { SubTask } from "../models/subtask.model.js";

// get tasks
const getTasks = asyncHandler( async (req,res) => {
    //:TODO
})

// create task
const postTask = asyncHandler( async (req,res) => {
    //:TODO
})

// get task details // bulk
const getTaskDetails = asyncHandler( async (req,res) => {
    //:TODO
})

// update task
const updateTaskById = asyncHandler( async (req,res) => {
    //:TODO
})

// delete task by id
const deleteTaskById = asyncHandler( async (req,res) => {
    //:TODO
})

// create subtask
const createSubTask = asyncHandler( async (req,res) => {
    //:TODO
})

// update subtask
const updateSubtask = asyncHandler( async (req,res) => {
    //:TODO
})

// delete subtask
const deleteSubTask = asyncHandler( async (req,res) => {
    //:TODO
})

export {
    getTasks,
    postTask,
    getTaskDetails,
    updateTaskById,
    deleteTaskById,
    createSubTask,
    updateSubtask,
    deleteSubTask,
}