import auto from 'eslint-config-canonical/auto';
import { recommended } from 'eslint-config-canonical/node';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  auto,
  {
    files: ['**/*.cjs', '**/*.js', '**/*.ts'],
    ...recommended[0],
  },
  {
    files: ['**/eslint.config.cjs'],
    rules: {
      'n/global-require': 0,
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-unused-expressions': 0,
      'id-length': 0,
    },
  },
  {
    ignores: ['**/dist/', '**/.*/'],
  },
);
