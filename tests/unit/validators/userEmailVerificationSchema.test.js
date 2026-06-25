import { userEmailVerificationSchema } from "../../../src/validators/index.js";

describe("userEmailVerificationSchema — Zod validation", () => {
  test("should pass with a valid verification token in params", () => {
    const result = userEmailVerificationSchema.safeParse({
      params: { verificationToken: "some-valid-token-abc123" },
    });

    expect(result.success).toBe(true);
  });

  test("should fail when verificationToken is an empty string", () => {
    const result = userEmailVerificationSchema.safeParse({
      params: { verificationToken: "" },
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) =>
      i.path.includes("verificationToken"),
    );
    expect(err).toBeDefined();
  });

  test("should fail when verificationToken is missing from params", () => {
    const result = userEmailVerificationSchema.safeParse({
      params: {},
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) =>
      i.path.includes("verificationToken"),
    );
    expect(err).toBeDefined();
  });
});
