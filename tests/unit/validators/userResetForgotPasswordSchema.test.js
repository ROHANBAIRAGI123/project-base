import { userResetForgotPasswordSchema } from "../../../src/validators/index.js";

const VALID_PASSWORD = "NewPass@123";
const VALID_TOKEN = "abc123resettoken";

describe("userResetForgotPasswordSchema — Zod validation", () => {
  test("should pass with matching passwords and a valid reset token", () => {
    const result = userResetForgotPasswordSchema.safeParse({
      body: {
        newPassword: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
      },
      params: { resetToken: VALID_TOKEN },
    });

    expect(result.success).toBe(true);
  });

  test("should fail when confirmPassword does not match newPassword", () => {
    const result = userResetForgotPasswordSchema.safeParse({
      body: {
        newPassword: VALID_PASSWORD,
        confirmPassword: "DifferentPass@9",
      },
      params: { resetToken: VALID_TOKEN },
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) =>
      i.path.includes("confirmPassword"),
    );
    expect(err).toBeDefined();
    expect(err.message).toBe("Password confirmation does not match");
  });

  test("should fail when resetToken param is missing", () => {
    const result = userResetForgotPasswordSchema.safeParse({
      body: {
        newPassword: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
      },
      params: {},
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) => i.path.includes("resetToken"));
    expect(err).toBeDefined();
  });

  test("should fail when newPassword does not meet strong password requirements", () => {
    const result = userResetForgotPasswordSchema.safeParse({
      body: {
        newPassword: "weakpass", // no uppercase, digit, special char
        confirmPassword: "weakpass",
      },
      params: { resetToken: VALID_TOKEN },
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) => i.path.includes("newPassword"));
    expect(err).toBeDefined();
  });
});
