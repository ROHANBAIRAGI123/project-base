import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import  {Project}  from "../models/project.model.js";
import  {ProjectMember}  from "../models/projectMember.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { UserRolesEnum } from "../utils/constants.js";
import { Task } from "../models/task.model.js";
import { SubTask } from "../models/subtask.model.js";

const getProjects = asyncHandler(async (req, res) => {
    //:TODO 
   const projects = await ProjectMember.aggregate([
  {
    $match: {
      user: new mongoose.Types.ObjectId(req.user._id)
    }
  },

  {
    $lookup: {
      from: "projects",
      localField: "project",
      foreignField: "_id",
      as: "projectData"
    }
  },

  { $unwind: "$projectData" },

  {
    $project: {
      _id: 0,
      projectInfo: {
        _id: "$projectData._id",
        name: "$projectData.name",
        description: "$projectData.description",
        createdBy: "$projectData.createdBy",
        createdAt: "$projectData.createdAt",
        updatedAt: "$projectData.updatedAt",
        totalMembers: "$projectData.totalMembers"
      }
    }
  }
]);

    return res.status(200).json(new ApiResponse(200, projects, "Projects fetched successfully!"));

})

const createProject = asyncHandler(async (req, res) => {
    //:TODO 
     const {name,description} = req.body;

    const project = await Project.create({
        name,
        description,
        createdBy: new mongoose.Types.ObjectId(req.user._id)
    })

    await ProjectMember.create({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(project._id),
        role: UserRolesEnum.ADMIN
    })

    return res.status(201).json( new ApiResponse(201,project,"Project Created Successfully!"))
})

const getProjectById = asyncHandler(async (req, res) => {
    //:TODO 
    const {projectId} = req.params;

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(400, "NO project found");
    }

    return res.status(201).json( new ApiResponse(200,project,"project fetched successfully"));
})

const updateProject = asyncHandler(async (req, res) => {
    //:TODO 
    const {name, description} = req.body;
    const {projectId} = req.params;

    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            name,
            description,
        },
        {
            new: true,
        })

    if(!project){
        throw new ApiError(400, "NO project found");
    }

    return res.status(201).json( new ApiResponse(200,project,"project updated successfully"));
})

const deleteProject = asyncHandler(async (req, res) => {
    //:TODO 
    const {name} = req.body;
    const {projectId} = req.params;

    const project = await Project.findById(projectId)

    
    if(!project){
        throw new ApiError(400, "No project found");
    }
    
    if(project.name !== name){
        throw new ApiError(400, "Names do not match")
    }
    
    try {
        const deletedProjectMember = await ProjectMember.deleteMany({project: new mongoose.Types.ObjectId(projectId)});
        const deletedProject = await Project.findByIdAndDelete(projectId);
        const deletedTasks = await Task.deleteMany({project: new mongoose.Types.ObjectId(projectId)});
        const deletedSubTasks = await SubTask.deleteMany({project: new mongoose.Types.ObjectId(projectId)});
        
        console.log(deletedProjectMember);
        console.log(deletedTasks);
        console.log(deletedSubTasks);
        console.log(deletedProject);


    } catch (error) {
        throw new ApiError(500,"Error deleting User");
    }

    return res.status(201).json( new ApiResponse(200,project,"project deleted successfully"));
})

const getProjectMembers = asyncHandler(async (req, res) => {
    //:TODO 

    const {projectId} = req.params;

    const projectMembers = await ProjectMember.aggregate([
  {
    $match: {
      project: new mongoose.Types.ObjectId(projectId)
    }
  },

  {
    $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "userData"
    }
  },

  { $unwind: "$userData" },

  {
    $project: {
      _id: 0,
      memberInfo: {
        _id: "$userData._id",
        username: "$userData.username",
        email: "$userData.email",
        role: "$role"
      }
    }
  }
]);

    return res.status(200).json(new ApiResponse(200, projectMembers, "Project members fetched successfully!"));
})

const updateMemberRole = asyncHandler(async (req, res) => {
    //:TODO 
    const {projectId, userId} = req.params;

    const {role} = req.body;

    const updatedMember = await ProjectMember.findOneAndUpdate(
        {
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(userId)
        },
        {
            role
        },
        {
            new: true,
        }
    )

    if(!updatedMember){
        throw new ApiError(400, "No member found for the project");
    }

    return res.status(201).json( new ApiResponse(200,updatedMember,"Member role updated successfully"));
})

const removeMember = asyncHandler(async (req, res) => {
    //:TODO 
    const {projectId, userId} = req.params;

    const deletedMember = await ProjectMember.findOneAndDelete({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId)
    })

    if(!deletedMember){
        throw new ApiError(400, "No member found for the project");
    }
    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            $inc: { totalMembers: -1 }
        },
        {
            new: true,
        }
    );

    return res.status(201).json( new ApiResponse(200,deletedMember,"Member removed successfully from project"));
})

export {
    getProjects,
    createProject,
    getProjectById,
    updateProject,
    deleteProject,
    getProjectMembers,
    updateMemberRole,
    removeMember,
}