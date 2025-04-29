module.exports = [
  ...require('eslint-config-canonical/configurations/auto'),
  {
    files: ['**/*.cjs', '**/*.js', '**/*.ts'],
    ...require('eslint-config-canonical/configurations/node').recommended
  },
  {
    files: ['**/eslint.config.cjs'],
    rules: {
      'n/global-require': 0,
    }
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      'id-length': 0,
      '@typescript-eslint/no-unused-expressions': 0,
      '@typescript-eslint/no-explicit-any': 0,
    },
  },
  {
    ignores: ['**/dist/', '**/.*/'],
  },
];