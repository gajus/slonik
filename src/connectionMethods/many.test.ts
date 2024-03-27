import { NotFoundError } from '../errors';
import { createPgPoolClientFactory } from '../factories/createPgPoolClientFactory';
import { createPool } from '../factories/createPool';
import { createSqlTag } from '../factories/createSqlTag';
import { createTestRunner } from '../helpers.test/createTestRunner';

const client = createPgPoolClientFactory();

const { test } = createTestRunner(client, 'pg');

const sql = createSqlTag();

test('returns the query results rows', async (t) => {
  const pool = await createPool(t.context.dsn, {
    client,
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
    client,
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
