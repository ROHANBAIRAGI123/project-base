import { deleteTaskSchema } from "../../../src/validators/index.js";

const VALID_PROJECT_ID = "507f1f77bcf86cd799439011";
const VALID_TASK_ID = "507f1f77bcf86cd799439014";

describe("deleteTaskSchema — Zod validation", () => {
  test("should pass with valid projectId and taskId params", () => {
    const result = deleteTaskSchema.safeParse({
      params: { projectId: VALID_PROJECT_ID, taskId: VALID_TASK_ID },
    });

    expect(result.success).toBe(true);
  });

  test("should fail when taskId is missing from params", () => {
    const result = deleteTaskSchema.safeParse({
      params: { projectId: VALID_PROJECT_ID },
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) => i.path.includes("taskId"));
    expect(err).toBeDefined();
  });

  test("should fail when projectId is not a valid mongo id", () => {
    const result = deleteTaskSchema.safeParse({
      params: { projectId: "not-valid", taskId: VALID_TASK_ID },
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) => i.path.includes("projectId"));
    expect(err).toBeDefined();
  });
});
