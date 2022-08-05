import test from 'ava';
import {
  expectTypeOf,
} from 'expect-type';
import {
  z,
} from 'zod';
import {
  type SchemaValidationError,

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

  const query = sql`SELECT 1`;

  const error = await t.throwsAsync(pool.oneFirst(query));

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

test('describes zod object associated with the query', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 1,
      },
    ],
  });

  const zodObject = z.object({
    foo: z.number(),
  });

  const query = sql.type(zodObject)`SELECT 1`;

  const result = await pool.oneFirst(query);

  expectTypeOf(result).toMatchTypeOf<number>();

  t.is(result, 1);
});

test('throws an error if object does match the zod object shape', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: '1',
      },
    ],
  });

  const zodObject = z.object({
    foo: z.number(),
  });

  const query = sql.type(zodObject)`SELECT 1`;

  const error = await t.throwsAsync<SchemaValidationError>(pool.oneFirst(query));

  t.is(error?.sql, 'SELECT 1');
  t.deepEqual(error?.row, {
    foo: '1',
  });
  t.deepEqual(error?.issues, [
    {
      code: 'invalid_type',
      expected: 'number',
      message: 'Expected number, received string',
      path: [
        'foo',
      ],
      received: 'string',
    },
  ]);
});
