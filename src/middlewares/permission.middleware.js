import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import User from "../models/user.model.js";
import {ProjectMember} from "../models/projectMember.model.js";


const chechProjectPermission = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user._id;

    const projectMember = await ProjectMember.findOne({ project: projectId, user: userId });

    if (!projectMember) {
      throw new ApiError(403, "You do not have permission to access this project");
    }          
    if (!roles.includes(projectMember.role)) {
      throw new ApiError(403, "You do not have the required role to access this project");
    }

    req.projectMember = projectMember;
    next();
  });
};

export { chechProjectPermission };