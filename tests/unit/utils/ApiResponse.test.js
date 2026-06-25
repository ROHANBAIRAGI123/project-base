import { describe, it } from "vitest";
import { ApiResponse } from "../../../src/utils/ApiResponse";
// Import it from: import { ApiResponse } from '../../../src/utils/ApiResponse.js'
// Usage: const res = new ApiResponse(200, { user }, 'Success');

describe("ApiResponse — standard response wrapper", () => {
  it.todo("should set statusCode correctly on the instance");

  it.todo("should set data correctly on the instance");

  it.todo("should set message correctly on the instance");

  it("should set success to true when statusCode is 200", () => {
    const res = new ApiResponse(200, { user: "123" }, "Success");
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual({ user: "123" });
    expect(res.message).toBe("Success");
    expect(res.success).toBe(true);
  });

  it.todo("should set success to true when statusCode is 201");

  it.todo("should set success to true when statusCode is 204");

  it.todo("should set success to false when statusCode is 400");

  it.todo("should set success to false when statusCode is 401");

  it.todo("should set success to false when statusCode is 403");

  it.todo("should set success to false when statusCode is 404");

  it.todo("should set success to false when statusCode is 500");

  it.todo('should default message to "Success" when no message is provided');

  it.todo("should accept null as a valid data value");

  it.todo("should accept an array as a valid data value");
});
