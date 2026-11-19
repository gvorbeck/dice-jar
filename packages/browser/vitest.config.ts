import { defineConfig } from 'vitest/config';

// `npm run test:coverage` fails if coverage drops below these; never lower them to make CI pass.
export default defineConfig({
  test: {
    coverage: {
      include: ['index.ts', 'ErrorBoundary.tsx', 'DiceJarCredit.tsx'],
      thresholds: { lines: 90, statements: 90, branches: 90, functions: 90 },
    },
  },
});
