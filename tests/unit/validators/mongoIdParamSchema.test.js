import { mongoIdParamSchema } from "../../../src/validators/index.js";

describe("mongoIdParamSchema — Zod validation", () => {
  test("should pass with a valid 24-character hex mongo id", () => {
    const result = mongoIdParamSchema.safeParse({
      params: { id: "507f1f77bcf86cd799439011" },
    });

    expect(result.success).toBe(true);
  });

  test("should fail when id is shorter than 24 characters", () => {
    const result = mongoIdParamSchema.safeParse({
      params: { id: "507f1f77bcf86cd7994390" }, // 22 chars
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) => i.path.includes("id"));
    expect(err).toBeDefined();
  });

  test("should fail when id contains non-hex characters", () => {
    const result = mongoIdParamSchema.safeParse({
      params: { id: "zzzzzzzzzzzzzzzzzzzzzzzz" },
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) => i.path.includes("id"));
    expect(err).toBeDefined();
  });

  test("should fail when id param is missing", () => {
    const result = mongoIdParamSchema.safeParse({
      params: {},
    });

    expect(result.success).toBe(false);
  });
});
