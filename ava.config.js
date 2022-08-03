const {
  TEST_ONLY_NON_INTEGRATION,
  TEST_ONLY_PG_INTEGRATION,
  TEST_ONLY_POSTGRES_INTEGRATION,
// eslint-disable-next-line node/no-process-env
} = process.env;

module.exports = () => {
  let files = [
    'test/slonik/**/*',
  ];

  if (TEST_ONLY_NON_INTEGRATION) {
    files = [
      'test/slonik/**/*',
      '!test/slonik/integration',
    ];
  }

  if (TEST_ONLY_PG_INTEGRATION) {
    files = [
      'test/slonik/integration/pg.ts',
    ];
  }

  if (TEST_ONLY_POSTGRES_INTEGRATION) {
    files = [
      'test/slonik/integration/postgres.ts',
    ];
  }

  return {
    extensions: [
      'ts',
    ],
    files,
    require: [
      'ts-node/register/transpile-only',
    ],
    timeout: '30s',
  };
};
