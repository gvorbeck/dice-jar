import { defineConfig } from 'vitest/config';

// `npm run test:coverage` fails if coverage drops below these; never lower them to make CI pass.
export default defineConfig({
  test: { coverage: { include: ['index.ts'], thresholds: { lines: 80, statements: 80, branches: 70, functions: 80 } } },
});
