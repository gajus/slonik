import { DataIntegrityError } from '../errors';
import { createSqlTag } from '../factories/createSqlTag';
import { createPool } from '../helpers/createPool';
import test from 'ava';

const sql = createSqlTag();

test('returns empty array if no rows are returned', async (t) => {
  const pool = await createPool();

  pool.querySpy.returns({
    rows: [],
  });

  const result = await pool.anyFirst(sql.unsafe`SELECT 1`);

  t.deepEqual(result, []);
});

test('returns first column values of the query result rows', async (t) => {
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

  const result = await pool.anyFirst(sql.unsafe`SELECT 1`);

  t.deepEqual(result, [1, 2]);
});

test('throws an error if more than one column is returned', async (t) => {
  const pool = await createPool();

  pool.querySpy.returns({
    rows: [
      {
        bar: 1,
        foo: 1,
      },
    ],
  });

  const error = await t.throwsAsync(pool.anyFirst(sql.unsafe`SELECT 1`));

  t.true(error instanceof DataIntegrityError);
});
