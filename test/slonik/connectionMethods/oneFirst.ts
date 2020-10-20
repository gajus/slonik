// @flow

import test from 'ava';
import {
  DataIntegrityError,
  NotFoundError,
  UnexpectedStateError,
} from '../../../src/errors';
import {
  createSqlTag,
} from '../../../src/factories/createSqlTag';
import {
  createPool,
} from '../../helpers/createPool';

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

  t.is(result, 1);
});

test('throws an error if no rows are returned', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [],
  });

  const error = await t.throwsAsync(pool.oneFirst(sql`SELECT 1`));

  t.true(error instanceof NotFoundError);
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

  const error = await t.throwsAsync(pool.oneFirst(sql`SELECT 1`));

  t.true(error instanceof DataIntegrityError);
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

  const error = await t.throwsAsync(pool.oneFirst(sql`SELECT 1`));

  t.true(error instanceof UnexpectedStateError);
});
