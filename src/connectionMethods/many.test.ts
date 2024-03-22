import { NotFoundError } from '../errors';
import { createSqlTag } from '../factories/createSqlTag';
import { createPool } from '../helpers/createPool';
import test from 'ava';

const sql = createSqlTag();

test('returns the query results rows', async (t) => {
  const pool = await createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 1,
      },
      {
        foo: 2,
      },
    ],
  });

  const result = await pool.many(sql.unsafe`SELECT 1`);

  t.deepEqual(result, [
    {
      foo: 1,
    },
    {
      foo: 2,
    },
  ]);
});

test('throws an error if no rows are returned', async (t) => {
  const pool = await createPool();

  pool.querySpy.returns({
    rows: [],
  });

  const error = await t.throwsAsync(pool.many(sql.unsafe`SELECT 1`));

  t.true(error instanceof NotFoundError);
});
