import { createPool } from '../factories/createPool';
import { createTestRunner } from '../helpers.test/createTestRunner';
import { DataIntegrityError, NotFoundError } from '@slonik/errors';
import { createPgDriverFactory } from '@slonik/pg-driver';
import { createSqlTag } from '@slonik/sql-tag';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

const sql = createSqlTag();

test('returns values of the query result rows', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const result = await pool.manyFirst(sql.unsafe`
    SELECT *
    FROM (VALUES (1), (2)) as t(id)
  `);

  t.deepEqual(result, [1, 2]);
});

test('throws an error if no rows are returned', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const error = await t.throwsAsync(
    pool.manyFirst(sql.unsafe`
      SELECT *
      FROM (VALUES (1), (2)) as t(id)
      WHERE false
    `),
  );

  t.true(error instanceof NotFoundError);
});

test('throws an error if more than one column is returned', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const error = await t.throwsAsync(
    pool.manyFirst(sql.unsafe`
      SELECT *
      FROM (VALUES (1, 'foo')) as t(id, name)
    `),
  );

  t.true(error instanceof DataIntegrityError);
});
