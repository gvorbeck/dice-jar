import js from '@eslint/js';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

const code = ['apps/*/src/**/*.{ts,tsx}', 'packages/*/src/**/*.{ts,tsx}'];

export default defineConfig(
  { ignores: ['**/dist', '**/coverage', '**/test-results', '**/playwright-report', '**/node_modules', 'apps/*/functions/lib'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  { rules: { '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', ignoreRestSiblings: true }] } },
  {
    files: [
      'apps/*/functions/**',
      'apps/*/e2e/**',
      'apps/*/test/**',
      'apps/*/*.config.ts',
      'packages/*/*.config.ts',
      '*.config.js',
      'scripts/**',
    ],
    languageOptions: { globals: globals.node },
  },
  {
    files: code,
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: globals.browser },
    rules: {
      'jsx-a11y/no-redundant-roles': ['error', { ol: ['list'] }], // list-style:none drops list semantics in Safari
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  prettier, // last, so formatting is Prettier's job alone
);
