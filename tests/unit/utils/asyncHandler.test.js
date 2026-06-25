// asyncHandler wraps an async controller function and forwards any thrown errors to next()
// Import it from: import { asyncHandler } from '../../../src/utils/asyncHandler.js'
// Usage: const wrappedFn = asyncHandler(async (req, res, next) => { ... });

import { vi } from "vitest";
import { asyncHandler } from "../../../src/utils/AsyncHandler.js";

describe("asyncHandler — async error wrapper", () => {
  test("should call the wrapped function with (req, res, next)", () => {
    const mockReq = {};
    const mockRes = {};
    const mockNext = vi.fn();
    const controllerFn = vi.fn();
    const wrappedFn = asyncHandler(controllerFn);

    wrappedFn(mockReq, mockRes, mockNext);

    expect(controllerFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
  });

  test("should call next(err) when the wrapped async function throws an error", async () => {
    const mockReq = {};
    const mockRes = {};
    const mockNext = vi.fn();
    const controllerFn = vi.fn().mockImplementation(() => {
      throw new Error("Test Error");
    });
    const wrappedFn = asyncHandler(controllerFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(controllerFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new Error("Test Error"));
  });

  test("should call next(err) when the wrapped async function rejects a Promise", async () => {
    const mockReq = {};
    const mockRes = {};
    const mockNext = vi.fn();
    const controllerFn = vi.fn().mockImplementation(() => {
      return Promise.reject(new Error("Test Error"));
    });
    const wrappedFn = asyncHandler(controllerFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(controllerFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new Error("Test Error"));
  });

  test("should NOT call next() when the function resolves successfully", () => {
    const mockReq = {};
    const mockRes = {};
    const mockNext = vi.fn();
    const controllerFn = vi.fn().mockImplementation(() => {
      return Promise.resolve();
    });
    const wrappedFn = asyncHandler(controllerFn);

    wrappedFn(mockReq, mockRes, mockNext);

    expect(controllerFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
