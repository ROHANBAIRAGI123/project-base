import { updateNoteSchema } from "../../../src/validators/index.js";

const VALID_PROJECT_ID = "507f1f77bcf86cd799439011";
const VALID_NOTE_ID = "507f1f77bcf86cd799439015";

describe("updateNoteSchema — Zod validation", () => {
  test("should pass when only title is updated", () => {
    const result = updateNoteSchema.safeParse({
      body: { title: "Updated Title" },
      params: { projectId: VALID_PROJECT_ID, noteId: VALID_NOTE_ID },
    });

    expect(result.success).toBe(true);
  });

  test("should pass when only content is updated", () => {
    const result = updateNoteSchema.safeParse({
      body: { content: "Updated content here." },
      params: { projectId: VALID_PROJECT_ID, noteId: VALID_NOTE_ID },
    });

    expect(result.success).toBe(true);
  });

  test("should pass when only status is updated", () => {
    const result = updateNoteSchema.safeParse({
      body: { status: "personal" },
      params: { projectId: VALID_PROJECT_ID, noteId: VALID_NOTE_ID },
    });

    expect(result.success).toBe(true);
  });

  test("should fail when body is empty (refine: at least one field required)", () => {
    const result = updateNoteSchema.safeParse({
      body: {},
      params: { projectId: VALID_PROJECT_ID, noteId: VALID_NOTE_ID },
    });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe(
      "At least one field must be provided for update",
    );
  });

  test("should fail when noteId param is not a valid mongo id", () => {
    const result = updateNoteSchema.safeParse({
      body: { title: "Title" },
      params: { projectId: VALID_PROJECT_ID, noteId: "bad-id" },
    });

    expect(result.success).toBe(false);
    const err = result.error.issues.find((i) => i.path.includes("noteId"));
    expect(err).toBeDefined();
  });
});
