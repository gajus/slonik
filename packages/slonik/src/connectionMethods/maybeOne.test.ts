import { createPool } from '../factories/createPool.js';
import { createTestRunner } from '../helpers.test/createTestRunner.js';
import { DataIntegrityError } from '@slonik/errors';
import { createPgDriverFactory } from '@slonik/pg-driver';
import { createSqlTag } from '@slonik/sql-tag';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

const sql = createSqlTag();

test('returns the first row', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const result = await pool.maybeOne(sql.unsafe`
    SELECT *
    FROM (VALUES (1)) as t(id)
  `);

  t.deepEqual(result, {
    id: 1,
  });
});

test('returns null if no results', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const result = await pool.maybeOne(sql.unsafe`
    SELECT *
    FROM (VALUES (1)) as t(id)
    WHERE false
  `);

  t.is(result, null);
});

test('throws an error if more than one row is returned', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const error = await t.throwsAsync(
    pool.maybeOne(sql.unsafe`
    SELECT *
    FROM (VALUES (1), (2)) as t(id)
  `),
  );

  t.true(error instanceof DataIntegrityError);
});
