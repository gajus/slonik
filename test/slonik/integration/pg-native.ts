import {
  native as pgClient,
} from 'pg';
import {
  createPool,
  sql,
} from '../../../src';
import {
  createTestRunner,
  createIntegrationTests,
} from '../../helpers/createIntegrationTests';

const {
  test,
} = createTestRunner(
  pgClient,
  'pg_native',
);

createIntegrationTests(
  test,
  pgClient,
);

test('throws an error stream method is used', async (t) => {
  const pool = createPool(t.context.dsn, {
    pgClient,
  });

  await pool.query(sql`
    INSERT INTO person (name) VALUES ('foo'), ('bar'), ('baz')
  `);

  await t.throwsAsync(
    pool.stream(sql`
      SELECT name
      FROM person
    `, () => {}),
    {
      message: 'Result cursors do not work with the native driver. Use JavaScript driver.',
    },
  );
});
