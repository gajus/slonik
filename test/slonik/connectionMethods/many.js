// @flow

import test from 'ava';
import createPool from '../../helpers/createPool';
import sql from '../../../src/templateTags/sql';
import {
  NotFoundError
} from '../../../src/errors';

test('returns the query results rows', async (t) => {
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

  const result = await pool.many(sql`SELECT 1`);

  t.deepEqual(result, [
    {
      foo: 1
    },
    {
      foo: 2
    }
  ]);
});

test('throws an error if no rows are returned', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: []
  });

  await t.throwsAsync(pool.many(sql`SELECT 1`), NotFoundError);
});
