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
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
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
      // shortcut: interim floor at the imported app's measured coverage (owner-approved 2026-11-20); raise it with every test added, reach 77/74/68/78 in the tests phase
      thresholds: { lines: 15, statements: 14, branches: 9, functions: 9 },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
