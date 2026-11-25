import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // lib/firebase.ts throws without these; the tests mock Firebase, so any value works
    env: Object.fromEntries(
      ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID'].map((k) => [
        `VITE_FIREBASE_${k}`,
        'test',
      ]),
    ),
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Include test files
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'scripts/**/*.test.ts'],
    // Exclude e2e tests
    exclude: ['e2e/**/*', 'node_modules/**/*'],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'e2e/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/test/**',
        '**/__tests__/**',
        '**/node_modules/**',
        'src/test/**',
      ],
      thresholds: { lines: 82, statements: 80, branches: 69, functions: 78 },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
