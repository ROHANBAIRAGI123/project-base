// ApiError is a custom error class that extends the native Error
// Import it from: import { ApiError } from '../../../src/utils/ApiError.js'
// Usage: const err = new ApiError(404, 'Not found');
import { ApiError } from "../../../src/utils/ApiError.js";

describe("ApiError — custom error class", () => {
  test("should be an instance of Error", () => {
    const err = new ApiError(404, "Not found");

    expect(err).toBeInstanceOf(Error);
  });

  test("should set statusCode correctly on the instance", () => {
    const err = new ApiError(404, "Not found");

    expect(err.statusCode).toBe(404);
  });

  test("should set message correctly on the instance", () => {
    const err = new ApiError(404, "Not found");

    expect(err.message).toBe("Not found");
  });

  test("should set success to false by default", () => {
    const err = new ApiError(404, "Not found");

    expect(err.success).toBeFalsy();
  });

  test("should accept an optional errors array as the third argument", () => {
    const err = new ApiError(404, "Not found");

    expect(err.errors).toEqual(expect.arrayContaining([]));
  });

  test("should default errors to an empty array when not provided", () => {
    const err = new ApiError(404, "Not found");

    expect(err.errors).toEqual([]);
  });
});
