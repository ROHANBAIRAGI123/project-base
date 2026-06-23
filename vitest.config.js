import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,                              // No need to import describe/it/expect in every file
        environment: 'node',
        globalSetup: './tests/setup/globalSetup.js', // Start MongoMemoryServer once before all suites
        setupFiles: ['./tests/setup/testSetup.js'],  // Clear DB between each test
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**'],
            exclude: ['src/index.js'],
        },
    },
});
