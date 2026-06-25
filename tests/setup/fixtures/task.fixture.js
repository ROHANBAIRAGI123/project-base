import { Task } from "../../../src/models/task.model.js";

// Creates a task inside a project, optionally assigned to a user
// Usage: const task = await createTask(project._id, assignee._id);
export async function createTask(projectId, assigneeId = null, overrides = {}) {
  return Task.create({
    title: "Test Task",
    description: "A task created for testing",
    project: projectId,
    assignedTo: assigneeId,
    status: "todo",
    ...overrides,
  });
}
