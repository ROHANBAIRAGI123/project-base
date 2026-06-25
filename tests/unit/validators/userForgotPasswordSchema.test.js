import { userForgotPasswordSchema } from "../../../src/validators/index.js";

describe("userForgotPasswordSchema — Zod validation", () => {
  test("should pass with a valid email address", () => {
    const result = userForgotPasswordSchema.safeParse({
      body: { email: "user@example.com" },
    });

    expect(result.success).toBe(true);
  });

  test("should fail when email is not a valid format", () => {
    const result = userForgotPasswordSchema.safeParse({
      body: { email: "not-an-email" },
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) => i.path.includes("email"));
    expect(err).toBeDefined();
  });

  test("should fail when email field is missing", () => {
    const result = userForgotPasswordSchema.safeParse({
      body: {},
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) => i.path.includes("email"));
    expect(err).toBeDefined();
  });

  test("should fail when email contains consecutive dots", () => {
    const result = userForgotPasswordSchema.safeParse({
      body: { email: "user..name@example.com" },
    });

    expect(result.success).toBe(false);
  });
});
