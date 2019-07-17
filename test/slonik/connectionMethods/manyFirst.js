// @flow

/* eslint-disable flowtype/no-weak-types */

import test from 'ava';
import createPool from '../../helpers/createPool';
import createSqlTag from '../../../src/factories/createSqlTag';
import {
  DataIntegrityError,
  NotFoundError
} from '../../../src/errors';

const sql = createSqlTag();

test('returns values of the query result rows', async (t) => {
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

  const result = await pool.manyFirst(sql`SELECT 1`);

  t.deepEqual(result, [
    1,
    2
  ]);
});

test('throws an error if no rows are returned', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: []
  });

  await t.throwsAsync(pool.manyFirst(sql`SELECT 1`), NotFoundError);
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

  await t.throwsAsync(pool.manyFirst(sql`SELECT 1`), DataIntegrityError);
});
