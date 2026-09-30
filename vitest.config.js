import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js', 'tests/db/**/*.test.js', 'tests/*.test.js'],
    exclude: ['tests/e2e/**', 'tests/design/**', 'node_modules/**'],
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
