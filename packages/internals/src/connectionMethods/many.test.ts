import { NotFoundError } from '../errors';
import { createPool } from '../factories/createPool';
import { createSqlTag } from '../factories/createSqlTag';
import { createTestDriverFactory } from '../factories/createTestDriverFactory';
import test from 'ava';

const driverFactory = createTestDriverFactory();

const sql = createSqlTag();

test('returns the query results rows', async (t) => {
  const pool = await createPool('postgres://', {
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
  const pool = await createPool('postgres://', {
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
