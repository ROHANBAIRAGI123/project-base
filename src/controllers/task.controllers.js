import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import  {Project}  from "../models/project.model.js";
import  {ProjectMember}  from "../models/projectMember.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { Task } from "../models/task.model.js";
import { SubTask } from "../models/subtask.model.js";

// get tasks
const getTasks = asyncHandler( async (req,res) => {
    const { projectId } = req.params;

    // Validate project existence
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Check if user is a member of the project
    const isMember = await ProjectMember.findOne({project: projectId, user: req.user._id});
    if (!isMember) {
        throw new ApiError(403, "You are not a member of this project");
    }
    
    // Fetch tasks for the project
    const tasks = await Task.find({ project: projectId }).populate('assignedTo', 'fullname email').populate('assignedBy', 'fullname email');
    res.status(200).json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
})

// create task
const createTask = asyncHandler( async (req,res) => {
    const { title, description, assignedTo} = req.body;
    const { projectId } = req.params;

    // Validate project existence
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Check if user is a member of the project
    const isMember = await ProjectMember.findOne({project: projectId, user: req.user._id});
    if (!isMember) {
        throw new ApiError(403, "You are not a member of this project");
    }

    // Create the task
    const task = await Task.create({
        title,
        description,
        project: projectId,
        assignedTo,
        assignedBy: req.user._id
    })
    res.status(201).json(new ApiResponse(201, task, "Task created successfully"));
})

// get task details // by id
const getTaskDetails = asyncHandler( async (req,res) => {
    const { taskId, projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new ApiError(400, "Invalid taskId");
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new ApiError(400, "Invalid projectId");
    }

    const isMember = await ProjectMember.findOne({ project: projectId, user: req.user._id });
    if (!isMember) {
      throw new ApiError(403, "You are not a member of this project");
    }

    const taskObjectId = new mongoose.Types.ObjectId(taskId);

    const task = await Task.aggregate([
    {
      $match: {
        _id: taskObjectId,
        project: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [
          {
            $project: {
                 _id: 1, username: 1, fullname: 1, avatar: 1
                 },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subtasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: {
                $arrayElemAt: ["$createdBy", 0],
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedTo: {
          $arrayElemAt: ["$assignedTo", 0],
        },
      },
    },
  ]);

    if (!task || task.length === 0) {
      throw new ApiError(404, "Task not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, task[0], "Task fetched successfully"));
})

// update task
const updateTaskById = asyncHandler( async (req,res) => {
    const { taskId, projectId } = req.params;
    const { title, description, assignedTo, status, priority } = req.body;
    
     if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid taskId");
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new ApiError(400, "Invalid projectId");
    }

    // Check if user is a member of the project
    const isMember = await ProjectMember.findOne({project: projectId, user: req.user._id});
    if (!isMember) {
        throw new ApiError(403, "You are not a member of this project");
    }

    const taskObjectId = new mongoose.Types.ObjectId(taskId);

    const existingTask = await Task.findOne({ _id: taskObjectId, project: projectId }).select("_id");
    if (!existingTask) {
      throw new ApiError(404, "Task not found");
    }
    
    const task = await Task.findOneAndUpdate({ _id: taskObjectId, project: projectId }, {
        title,
        description,
        assignedTo,
        status,
        priority
    }, {new: true, runValidators: true});

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    res.status(200).json(new ApiResponse(200, task, "Task updated successfully"));

})

// delete task by id
const deleteTaskById = asyncHandler( async (req,res) => {
    const { taskId, projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid taskId");
    }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid projectId");
  }

  const taskObjectId = new mongoose.Types.ObjectId(taskId);

  const existingTask = await Task.findOne({ _id: taskObjectId, project: projectId }).select("_id");
  if (!existingTask) {
    throw new ApiError(404, "Task not found");
  }

    const isMember = await ProjectMember.findOne({project: projectId, user: req.user._id});
    if (!isMember) {
        throw new ApiError(403, "You are not a member of this project");
    }

    try{
        // Delete subtasks associated with the task
        await SubTask.deleteMany({ task: taskObjectId });
        // Delete the task
    const deletedTask = await Task.findOneAndDelete({ _id: taskObjectId, project: projectId });

        if (!deletedTask) {
            throw new ApiError(404, "Task not found");
        }
    }
    catch(err){
        console.error("Error deleting subtasks:", err);
        throw new ApiError(500, "Failed to delete subtasks");
    }

    res.status(200).json(new ApiResponse(200, null, "Task deleted successfully"));
})

// create subtask
const createSubTask = asyncHandler( async (req,res) => {
    const {taskId, projectId}  = req.params;
    const {title, description} = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid taskId");
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new ApiError(400, "Invalid projectId");
    }

    const taskObjectId = new mongoose.Types.ObjectId(taskId);

    const parentTask = await Task.findOne({ _id: taskObjectId, project: projectId }).select("_id");
    if (!parentTask) {
      throw new ApiError(404, "Task not found in this project");
    }

    // Check if user is a member of the project
    const isMember = await ProjectMember.findOne({project: projectId, user: req.user._id});
    if (!isMember) {
        throw new ApiError(403, "You are not a member of this project");
    }

    const subTask = await SubTask.create({
        title,
        description,
        project: projectId,
        task: taskObjectId,
        createdBy: req.user._id
    })

    res.status(201).json(new ApiResponse(201, subTask, "Subtask created successfully"));
})

// update subtask
const updateSubtask = asyncHandler( async (req,res) => {
    const { subTaskId, projectId } = req.params;
    const { title, description, status, priority } = req.body;
    
     if (!mongoose.Types.ObjectId.isValid(subTaskId)) {
        throw new ApiError(400, "Invalid subTaskId");
    }

    // Check if user is a member of the project
    const isMember = await ProjectMember.findOne({project: projectId, user: req.user._id});
    if (!isMember) {
        throw new ApiError(403, "You are not a member of this project");
    }

    const subTaskObjectId = new mongoose.Types.ObjectId(subTaskId);
    
    const subTask = await SubTask.findByIdAndUpdate(subTaskObjectId,{
        title,
        description,
        status,
        priority
    }, {new: true});

    if (!subTask) {
        throw new ApiError(404, "Subtask not found");
    }

    res.status(200).json(new ApiResponse(200, subTask, "Subtask updated successfully"));
})

// delete subtask
const deleteSubTask = asyncHandler( async (req,res) => {
    const { subTaskId, projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subTaskId)) {
        throw new ApiError(400, "Invalid subTaskId");
    }

    // Check if user is a member of the project
    const isMember = await ProjectMember.findOne({project: projectId, user: req.user._id});
    if (!isMember) {
        throw new ApiError(403, "You are not a member of this project");
    }

    const subTaskObjectId = new mongoose.Types.ObjectId(subTaskId);

    try{
        // Delete the subtask
        const deletedSubTask = await SubTask.findByIdAndDelete(subTaskObjectId);


        if (!deletedSubTask) {
            throw new ApiError(404, "Subtask not found");
        }
    }
    catch(err){
        console.error("Error deleting subtasks:", err);
        throw new ApiError(500, "Failed to delete subtasks");
    }

    res.status(200).json(new ApiResponse(200, null, "Subtask deleted successfully"));
})

export {
    getTasks,
    createTask,
    getTaskDetails,
    updateTaskById,
    deleteTaskById,
    createSubTask,
    updateSubtask,
    deleteSubTask,
}