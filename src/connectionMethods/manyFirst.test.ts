import { DataIntegrityError, NotFoundError } from '../errors';
import { createPgPoolClientFactory } from '../factories/createPgPoolClientFactory';
import { createPool } from '../factories/createPool';
import { createSqlTag } from '../factories/createSqlTag';
import { createTestRunner } from '../helpers.test/createTestRunner';

const client = createPgPoolClientFactory();

const { test } = createTestRunner(client, 'pg');

const sql = createSqlTag();

test('returns values of the query result rows', async (t) => {
  const pool = await createPool(t.context.dsn, {
    client,
  });

  const result = await pool.manyFirst(sql.unsafe`
    SELECT *
    FROM (VALUES (1), (2)) as t(id)
  `);

  t.deepEqual(result, [1, 2]);
});

test('throws an error if no rows are returned', async (t) => {
  const pool = await createPool(t.context.dsn, {
    client,
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
    client,
  });

  const error = await t.throwsAsync(
    pool.manyFirst(sql.unsafe`
      SELECT *
      FROM (VALUES (1, 'foo')) as t(id, name)
    `),
  );

  t.true(error instanceof DataIntegrityError);
});
