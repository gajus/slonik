import { DataIntegrityError } from '../errors';
import { createPgPoolClientFactory } from '../factories/createPgPoolClientFactory';
import { createPool } from '../factories/createPool';
import { createSqlTag } from '../factories/createSqlTag';
import { createTestRunner } from '../helpers.test/createTestRunner';

const client = createPgPoolClientFactory();

const { test } = createTestRunner(client, 'pg');

const sql = createSqlTag();

test('returns empty array if no rows are returned', async (t) => {
  const pool = await createPool(t.context.dsn, {
    client,
  });

  const result = await pool.anyFirst(sql.unsafe`
    SELECT *
    FROM (VALUES (1)) as t(id)
    WHERE false
  `);

  t.deepEqual(result, []);
});

test('returns first column values of the query result rows', async (t) => {
  const pool = await createPool(t.context.dsn, {
    client,
  });

  const result = await pool.anyFirst(sql.unsafe`
    SELECT *
    FROM (VALUES (1), (2)) as t(id)
  `);

  t.deepEqual(result, [1, 2]);
});

test('throws an error if more than one column is returned', async (t) => {
  const pool = await createPool(t.context.dsn, {
    client,
  });

  const error = await t.throwsAsync(
    pool.anyFirst(sql.unsafe`
      SELECT *
      FROM (VALUES (1, 'foo')) as t(id, name)
    `),
  );

  t.true(error instanceof DataIntegrityError);
});
