import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    // Real MySQL test DB requires sequential execution to prevent table-drop race conditions
    fileParallelism: false,
    isolate: false,
    hookTimeout: 60000,
    testTimeout: 60000,
  },
});