import { createPool } from '../factories/createPool.js';
import { createTestRunner } from '../helpers.test/createTestRunner.js';
import { NotFoundError } from '@slonik/errors';
import { createPgDriverFactory } from '@slonik/pg-driver';
import { createSqlTag } from '@slonik/sql-tag';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

const sql = createSqlTag();

test('returns the query results rows', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const result = await pool.many(sql.unsafe`
    SELECT *
    FROM (VALUES (1), (2)) as t(id)
  `);

  t.deepEqual(result, [
    {
      id: 1,
    },
    {
      id: 2,
    },
  ]);
});

test('throws an error if no rows are returned', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const error = await t.throwsAsync(
    pool.many(sql.unsafe`
      SELECT *
      FROM (VALUES (1)) as t(id)
      WHERE false
    `),
  );

  t.true(error instanceof NotFoundError);
});
