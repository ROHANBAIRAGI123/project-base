import { Project } from "../../../src/models/project.model.js";
import { ProjectMember } from "../../../src/models/projectMember.model.js";

// Creates a project and registers ownerId as an Admin member
// Usage: const { project } = await createProject(adminUser._id);
export async function createProject(ownerId, overrides = {}) {
  const project = await Project.create({
    name: "Test Project",
    description: "A project created for testing",
    ...overrides,
  });

  await ProjectMember.create({
    project: project._id,
    user: ownerId,
    role: "admin",
  });

  return project;
}
