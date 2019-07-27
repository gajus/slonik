// @flow

import test from 'ava';
import createPool from '../../helpers/createPool';
import createSqlTag from '../../../src/factories/createSqlTag';
import {
  DataIntegrityError,
  NotFoundError,
} from '../../../src/errors';

const sql = createSqlTag();

test('returns the first row', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 1,
      },
    ],
  });

  const result = await pool.one(sql`SELECT 1`);

  t.deepEqual(result, {
    foo: 1,
  });
});

test('throws an error if no rows are returned', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [],
  });

  await t.throwsAsync(pool.one(sql`SELECT 1`), NotFoundError);
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

  await t.throwsAsync(pool.one(sql`SELECT 1`), DataIntegrityError);
});
