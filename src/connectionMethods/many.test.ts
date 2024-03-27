import { NotFoundError } from '../errors';
import { createPgDriver } from '../factories/createPgDriver';
import { createPool } from '../factories/createPool';
import { createSqlTag } from '../factories/createSqlTag';
import { createTestRunner } from '../helpers.test/createTestRunner';

const driver = createPgDriver();

const { test } = createTestRunner(driver, 'pg');

const sql = createSqlTag();

test('returns the query results rows', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driver,
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
    driver,
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
