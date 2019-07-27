// @flow

import test from 'ava';
import createPool from '../../helpers/createPool';
import createSqlTag from '../../../src/factories/createSqlTag';
import {
  DataIntegrityError,
  NotFoundError,
  UnexpectedStateError,
} from '../../../src/errors';

const sql = createSqlTag();

test('returns value of the first column from the first row', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 1,
      },
    ],
  });

  const result = await pool.oneFirst(sql`SELECT 1`);

  t.deepEqual(result, 1);
});

test('throws an error if no rows are returned', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [],
  });

  await t.throwsAsync(pool.oneFirst(sql`SELECT 1`), NotFoundError);
});

test('throws an error if more than one row is returned', async (t) => {
  const pool = createPool();

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

  await t.throwsAsync(pool.oneFirst(sql`SELECT 1`), DataIntegrityError);
});

test('throws an error if more than one column is returned', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        bar: 1,
        foo: 1,
      },
    ],
  });

  await t.throwsAsync(pool.oneFirst(sql`SELECT 1`), UnexpectedStateError);
});
