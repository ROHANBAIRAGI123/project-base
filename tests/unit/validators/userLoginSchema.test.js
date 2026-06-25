import { userLoginSchema } from "../../../src/validators/index.js";

describe("userLoginSchema — Zod validation", () => {
  test("should pass with a valid email and password", () => {
    const result = userLoginSchema.safeParse({
      body: {
        email: "user@example.com",
        password: "ValidPass1",
      },
    });

    expect(result.success).toBe(true);
  });

  test("should fail when email is not a valid email format", () => {
    const result = userLoginSchema.safeParse({
      body: {
        email: "not-an-email",
        password: "ValidPass1",
      },
    });

    expect(result.success).toBe(false);
    const emailError = result.error.issues.find((issue) =>
      issue.path.includes("email"),
    );
    expect(emailError).toBeDefined();
  });

  test("should fail when password is an empty string", () => {
    const result = userLoginSchema.safeParse({
      body: {
        email: "user@example.com",
        password: "",
      },
    });

    expect(result.success).toBe(false);
    const passwordError = result.error.issues.find((issue) =>
      issue.path.includes("password"),
    );
    expect(passwordError).toBeDefined();
  });

  test("should fail when neither email nor username is provided", () => {
    const result = userLoginSchema.safeParse({
      body: {
        password: "ValidPass1",
      },
    });

    expect(result.success).toBe(false);
    // The .refine on body fires when both email and username are absent
    const refineError = result.error.issues.find((issue) =>
      issue.path.includes("email"),
    );
    expect(refineError).toBeDefined();
    expect(refineError.message).toBe("Either email or username is required");
  });

  test("should fail when password field is missing", () => {
    const result = userLoginSchema.safeParse({
      body: {
        email: "user@example.com",
      },
    });

    expect(result.success).toBe(false);
    const passwordError = result.error.issues.find((issue) =>
      issue.path.includes("password"),
    );
    expect(passwordError).toBeDefined();
  });

  test("should pass with a username instead of email", () => {
    const result = userLoginSchema.safeParse({
      body: {
        username: "validuser123",
        password: "ValidPass1",
      },
    });

    expect(result.success).toBe(true);
  });
});
