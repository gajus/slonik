import test from 'ava';
import {
  DataIntegrityError,
} from '../../../src/errors';
import {
  createSqlTag,
} from '../../../src/factories/createSqlTag';
import {
  createPool,
} from '../../helpers/createPool';

const sql = createSqlTag();

test('returns the first row', async (t) => {
  const pool = await createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 1,
      },
    ],
  });

  const result = await pool.maybeOneFirst(sql.unsafe`SELECT 1`);

  t.is(result, 1);
});

test('returns null if no results', async (t) => {
  const pool = await createPool();

  pool.querySpy.returns({
    rows: [],
  });

  const result = await pool.maybeOneFirst(sql.unsafe`SELECT 1`);

  t.is(result, null);
});

test('throws an error if more than one row is returned', async (t) => {
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

  const error = await t.throwsAsync(pool.maybeOneFirst(sql.unsafe`SELECT 1`));

  t.true(error instanceof DataIntegrityError);
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

  const error = await t.throwsAsync(pool.maybeOneFirst(sql.unsafe`SELECT 1`));

  t.true(error instanceof DataIntegrityError);
});
