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
} from '../../../src/errors';
import {
  createSqlTag,
} from '../../../src/factories/createSqlTag';
import {
  createPool,
} from '../../helpers/createPool';

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

  const error = await t.throwsAsync(pool.one(sql`SELECT 1`));

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

  const error = await t.throwsAsync(pool.one(sql`SELECT 1`));

  t.true(error instanceof DataIntegrityError);
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

  const result = await pool.one(query);

  expectTypeOf(result).toMatchTypeOf<{foo: number, }>();

  t.deepEqual(result, {
    foo: 1,
  });
});

test('respects zod transformers', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 'x,y',
      },
    ],
  });

  const zodObject = z.object({
    foo: z.string().transform(s => s.split(',')),
  });

  const query = sql.type(zodObject)`SELECT 'x,y' as foo`;

  const result = await pool.one(query);

  expectTypeOf(result).toMatchTypeOf<{ foo: string[] }>();

  t.deepEqual(result, {
    foo: ['x', 'y'],
  });
});

test('strips keys by default', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 'x',
        bar: 'y',
      },
    ],
  });

  const zodObject = z.object({
    foo: z.string(),
  });

  const query = sql.type(zodObject)`SELECT 'x' as foo, 'y' as bar`;

  const result = await pool.one(query);

  expectTypeOf(result).toMatchTypeOf<{ foo: string }>();

  t.deepEqual(result, {
    foo: 'x',
  });
});

test('respects strict zod object', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 'x',
        bar: 'y',
      },
    ],
  });

  const zodObject = z.object({
    foo: z.string(),
  }).strict();

  const query = sql.type(zodObject)`SELECT 'x' as foo, 'y' as bar`;

  const error = await t.throwsAsync<SchemaValidationError>(pool.one(query));

  if (!error) {
    throw new Error('Expected SchemaValidationError');
  }

  t.is(error.issues.length, 1);
  t.is(error.issues[0]?.code, 'unrecognized_keys');
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

  const error = await t.throwsAsync<SchemaValidationError>(pool.one(query));

  if (!error) {
    throw new Error('Expected SchemaValidationError');
  }

  t.is(error.issues.length, 1);
  t.is(error.issues[0]?.code, 'invalid_type');
});

test('throws an error if object does match the zod object shape (2)', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        bar: 1,
        foo: 1,
      },
    ],
  });

  const zodObject = z.object({
    foo: z.number(),
  });

  const query = sql.type(zodObject.strict())`SELECT 1`;

  const error = await t.throwsAsync<SchemaValidationError>(pool.one(query));

  if (!error) {
    throw new Error('Expected SchemaValidationError');
  }

  t.is(error.issues.length, 1);
  t.is(error.issues[0]?.code, 'unrecognized_keys');
});
