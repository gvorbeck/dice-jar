import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['src/**/*.test.ts', 'functions/src/**/*.test.ts'],
    // `npm run test:coverage` fails if coverage drops below these. Raise them as tests are added; never lower them to make CI pass.
    coverage: {
      include: ['src/**', 'functions/src/**'],
      exclude: ['**/*.tsx'], // screens are covered by the browser tests in e2e/; this floor guards the logic
      thresholds: { lines: 96, statements: 91, branches: 68, functions: 79 },
    },
  },
});
