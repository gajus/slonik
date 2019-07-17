// @flow

import test from 'ava';
import createPool from '../../helpers/createPool';
import createSqlTag from '../../../src/factories/createSqlTag';
import {
  DataIntegrityError
} from '../../../src/errors';

const sql = createSqlTag();

test('returns the first row', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 1
      }
    ]
  });

  const result = await pool.maybeOne(sql`SELECT 1`);

  t.deepEqual(result, {
    foo: 1
  });
});

test('returns null if no results', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: []
  });

  const result = await pool.maybeOne(sql`SELECT 1`);

  t.assert(result === null);
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

  await t.throwsAsync(pool.maybeOne(sql`SELECT 1`), DataIntegrityError);
});
