import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectMember.model.js";
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
        user: new mongoose.Types.ObjectId(req.user._id),
      },
    },

    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "projectData",
      },
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
          totalMembers: "$projectData.totalMembers",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully!"));
});

const createProject = asyncHandler(async (req, res) => {
  //:TODO
  const { name, description } = req.body;

  const project = await Project.create({
    name,
    description,
    createdBy: new mongoose.Types.ObjectId(req.user._id),
  });

  await ProjectMember.create({
    user: new mongoose.Types.ObjectId(req.user._id),
    project: new mongoose.Types.ObjectId(project._id),
    role: UserRolesEnum.ADMIN,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, project, "Project Created Successfully!"));
});

const getProjectById = asyncHandler(async (req, res) => {
  //:TODO
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(400, "NO project found");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, project, "project fetched successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { projectId } = req.params;

  const project = await Project.findByIdAndUpdate(
    projectId,
    {
      name,
      description,
    },
    {
      new: true,
    },
  );

  if (!project) {
    throw new ApiError(400, "NO project found");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, project, "project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  //:TODO
  const { name } = req.body;
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(400, "No project found");
  }

  if (project.name !== name) {
    throw new ApiError(400, "Names do not match");
  }

  try {
    const deletedProjectMember = await ProjectMember.deleteMany({
      project: new mongoose.Types.ObjectId(projectId),
    });
    const deletedProject = await Project.findByIdAndDelete(projectId);
    const deletedTasks = await Task.deleteMany({
      project: new mongoose.Types.ObjectId(projectId),
    });
    const deletedSubTasks = await SubTask.deleteMany({
      project: new mongoose.Types.ObjectId(projectId),
    });

    console.log(deletedProjectMember);
    console.log(deletedTasks);
    console.log(deletedSubTasks);
    console.log(deletedProject);
  } catch (error) {
    throw new ApiError(500, "Error deleting User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, project, "project deleted successfully"));
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const projectMembers = await ProjectMember.aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userData",
      },
    },

    { $unwind: "$userData" },

    {
      $project: {
        _id: 0,
        memberInfo: {
          _id: "$userData._id",
          username: "$userData.username",
          email: "$userData.email",
          role: "$role",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectMembers,
        "Project members fetched successfully!",
      ),
    );
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;

  const { role } = req.body;

  const updatedMember = await ProjectMember.findOneAndUpdate(
    {
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(userId),
    },
    {
      role,
    },
    {
      new: true,
    },
  );

  if (!updatedMember) {
    throw new ApiError(400, "No member found for the project");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, updatedMember, "Member role updated successfully"),
    );
});

const removeMember = asyncHandler(async (req, res) => {
  //:TODO
  const { projectId, userId } = req.params;

  const deletedMember = await ProjectMember.findOneAndDelete({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!deletedMember) {
    throw new ApiError(400, "No member found for the project");
  }
  const project = await Project.findByIdAndUpdate(
    projectId,
    {
      $inc: { totalMembers: -1 },
    },
    {
      new: true,
    },
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        deletedMember,
        "Member removed successfully from project",
      ),
    );
});

// const addMemberToProject = asyncHandler(async (req, res) => {
//     //:TODO
//     const {projectId} = req.params;
//     const {userId, role} = req.body;

//     const newMember = await ProjectMember.create({
//         project: new mongoose.Types.ObjectId(projectId),
//         user: new mongoose.Types.ObjectId(userId),
//         role
//     })

//     await Project.findByIdAndUpdate(
//         projectId,
//         {
//             $inc: { totalMembers: 1 }
//         },
//         {
//             new: true,
//         }
//     );

//     return res.status(201).json( new ApiResponse(200,newMember,"Member added successfully to project"));
// })

export {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers,
  updateMemberRole,
  removeMember,
};

/*
 * ===========================================================================================
 *                              NOTES — project.controllers.js
 * ===========================================================================================
 *
 * PURPOSE: Handles business logic for creating, updating, deleting projects, and managing their members.
 * ROLE IN ARCHITECTURE: Controller layer. Manages the core structural entities of the application.
 *
 * IMPORTS:
 * - `Project`, `ProjectMember`, `Task`, `SubTask`: Models needed for cascading deletes and complex aggregations.
 * - `ApiResponse`, `ApiError`, `asyncHandler`.
 * - `mongoose`: For `$lookup` aggregation pipelines and `ObjectId` casting.
 *
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `getProjects`: Uses an aggregation pipeline on `ProjectMember` to find all projects where the current user is a member, then joins (`$lookup`) the `projects` collection to return detailed project data.
 * - `createProject`: Creates the Project document, then creates a `ProjectMember` document assigning the creator the role of `ADMIN`.
 * - `deleteProject`: Implements a cascading delete. It deletes the project, its members, all tasks, and all subtasks. Requires the user to confirm the project name.
 * - `getProjectMembers`: Uses aggregation on `ProjectMember` to join with the `users` collection, returning a sanitized list of members and their roles.
 * - `updateMemberRole` / `removeMember`: Modifies the `ProjectMember` collection to update roles or remove access. `removeMember` also decrements the `totalMembers` counter on the Project.
 *
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: `project.routes.js`.
 * - Outbound dependencies: Interacts with multiple models simultaneously, especially during deletion.
 *
 * DESIGN PATTERNS:
 * - Aggregation Pipeline: Uses MongoDB's powerful `$lookup` to perform SQL-like joins across collections efficiently.
 * - Cascading Deletes: Manually cleans up child records (`ProjectMember`, `Task`, `SubTask`) when a parent (`Project`) is deleted to prevent orphaned documents and database bloat.
 *
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why use `aggregate` instead of `find().populate()` in `getProjects`?
 *    Answer: Because we are querying the *pivot* table (`ProjectMember`) to find the user's memberships, and we want to flatten the response so it looks like an array of Projects. Aggregation pipelines allow us to `$unwind` and `$project` the exact shape we want, which is faster and cleaner than doing data mapping in JavaScript memory.
 * 2. In `deleteProject`, why do we delete Tasks and Subtasks? What would happen if we didn't?
 *    Answer: Since MongoDB is a NoSQL database, there are no built-in foreign key constraints with `ON DELETE CASCADE`. If we didn't manually delete them, they would become "orphaned" documents taking up space, and could cause bugs if a query ever encountered a Task pointing to a non-existent Project.
 * 3. Why require the user to send the project `name` in the body during `deleteProject`?
 *    Answer: It's a UX safety mechanism (common in tools like GitHub). Deleting a project is highly destructive. Requiring the exact name ensures the action is intentional and not an accidental click.
 */
