// @flow

import test from 'ava';
import createPool from '../../helpers/createPool';
import sql from '../../../src/templateTags/sql';
import {
  DataIntegrityError
} from '../../../src/errors';

test('returns the first row', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 1
      }
    ]
  });

  const result = await pool.maybeOneFirst(sql`SELECT 1`);

  t.deepEqual(result, 1);
});

test('returns null if no results', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: []
  });

  const result = await pool.maybeOneFirst(sql`SELECT 1`);

  t.true(result === null);
});

test('throws an error if more than one row is returned', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 1
      },
      {
        foo: 2
      }
    ]
  });

  await t.throwsAsync(pool.maybeOneFirst(sql`SELECT 1`), DataIntegrityError);
});

test('throws an error if more than one column is returned', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        bar: 1,
        foo: 1
      }
    ]
  });

  await t.throwsAsync(pool.maybeOneFirst(sql`SELECT 1`), DataIntegrityError);
});
