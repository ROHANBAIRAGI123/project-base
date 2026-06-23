// asyncHandler wraps an async controller function and forwards any thrown errors to next()
// Import it from: import { asyncHandler } from '../../../src/utils/asyncHandler.js'
// Usage: const wrappedFn = asyncHandler(async (req, res, next) => { ... });

describe('asyncHandler — async error wrapper', () => {
    test.todo('should call the wrapped function with (req, res, next)');

    test.todo('should call next(err) when the wrapped async function throws an error');

    test.todo('should call next(err) when the wrapped async function rejects a Promise');

    test.todo('should NOT call next() when the function resolves successfully');
});
