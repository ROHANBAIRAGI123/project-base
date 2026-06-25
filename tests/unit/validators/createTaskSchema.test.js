import { createTaskSchema } from "../../../src/validators/index.js";

const VALID_PROJECT_ID = "507f1f77bcf86cd799439011";

describe("createTaskSchema — Zod validation", () => {
  test("should pass with only a title (status and priority default)", () => {
    const result = createTaskSchema.safeParse({
      body: { title: "Fix the login bug" },
      params: { projectId: VALID_PROJECT_ID },
    });

    expect(result.success).toBe(true);
    // Defaults should be applied
    expect(result.data.body.status).toBe("todo");
    expect(result.data.body.priority).toBe("medium");
  });

  test("should pass with a full valid payload", () => {
    const result = createTaskSchema.safeParse({
      body: {
        title: "Full task",
        description: "Some description",
        status: "in_progress",
        priority: "high",
        dueDate: "2030-01-01T00:00:00.000Z",
        estimatedHours: 5,
        tags: ["bug", "frontend"],
      },
      params: { projectId: VALID_PROJECT_ID },
    });

    expect(result.success).toBe(true);
  });

  test("should fail when title is missing", () => {
    const result = createTaskSchema.safeParse({
      body: {},
      params: { projectId: VALID_PROJECT_ID },
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) => i.path.includes("title"));
    expect(err).toBeDefined();
  });

  test("should fail when status is not a valid enum value", () => {
    const result = createTaskSchema.safeParse({
      body: { title: "Task", status: "pending" },
      params: { projectId: VALID_PROJECT_ID },
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) => i.path.includes("status"));
    expect(err).toBeDefined();
  });

  test("should fail when priority is not a valid enum value", () => {
    const result = createTaskSchema.safeParse({
      body: { title: "Task", priority: "critical" },
      params: { projectId: VALID_PROJECT_ID },
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) => i.path.includes("priority"));
    expect(err).toBeDefined();
  });

  test("should fail when projectId param is not a valid mongo id", () => {
    const result = createTaskSchema.safeParse({
      body: { title: "Task" },
      params: { projectId: "invalid" },
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) => i.path.includes("projectId"));
    expect(err).toBeDefined();
  });

  test("should fail when estimatedHours is below 0.5", () => {
    const result = createTaskSchema.safeParse({
      body: { title: "Task", estimatedHours: 0.1 },
      params: { projectId: VALID_PROJECT_ID },
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) =>
      i.path.includes("estimatedHours"),
    );
    expect(err).toBeDefined();
  });
});
