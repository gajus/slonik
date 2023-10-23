const {
  TEST_ONLY,
  // eslint-disable-next-line node/no-process-env
} = process.env;

module.exports = () => {
  let files = ['test/slonik/**/*'];

  if (TEST_ONLY === 'utilities') {
    files = ['test/slonik/**/*', '!test/slonik/integration'];
  }

  if (TEST_ONLY === 'pg-integration') {
    files = ['test/slonik/integration/pg.ts'];
  }

  if (TEST_ONLY === 'postgres-integration') {
    files = ['test/slonik/integration/postgres.ts'];
  }

  return {
    extensions: ['ts'],
    files,
    require: ['ts-node/register/transpile-only'],
    timeout: '30s',
  };
};
