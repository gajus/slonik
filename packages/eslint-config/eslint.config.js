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
    files: ['**/*.ts'],
    rules: {
      'canonical/prefer-inline-type-import': 0,
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import/extensions': ['error', 'always'],
      'import/no-duplicates': 0,
      'import/no-useless-path-segments': 0,
      'perfectionist/sort-modules': 0,
    },
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
