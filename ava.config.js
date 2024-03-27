const {
  TEST_ONLY,
  // eslint-disable-next-line n/no-process-env
} = process.env;

module.exports = () => {
  let files = ['src/**/*.test.ts'];

  if (TEST_ONLY === 'utilities') {
    files = ['src/**/*.test.ts', '!src/integration.test'];
  }

  if (TEST_ONLY === 'pg-integration') {
    files = ['src/integration.test/pg.test.ts'];
  }

  return {
    extensions: ['ts'],
    files,
    require: ['ts-node/register/transpile-only'],
    timeout: '30s',
  };
};
