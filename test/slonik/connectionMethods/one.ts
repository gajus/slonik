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
  const pool = await createPool();

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
  const pool = await createPool();

  pool.querySpy.returns({
    rows: [],
  });

  const error = await t.throwsAsync(pool.one(sql`SELECT 1`));

  t.true(error instanceof NotFoundError);
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

  const error = await t.throwsAsync(pool.one(sql`SELECT 1`));

  t.true(error instanceof DataIntegrityError);
});

test('describes zod object associated with the query', async (t) => {
  const pool = await createPool();

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

test('uses zod transform', async (t) => {
  const pool = await createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: '1,2',
      },
    ],
  });

  const coordinatesType = z.string().transform((subject) => {
    const [
      x,
      y,
    ] = subject.split(',');

    return {
      x: Number(x),
      y: Number(y),
    };
  });

  const zodObject = z.object({
    foo: coordinatesType,
  });

  const query = sql.type(zodObject)`SELECT '1,2' as foo`;

  const result = await pool.one(query);

  expectTypeOf(result).toMatchTypeOf<{foo: {x: number, y: number, }, }>();

  t.deepEqual(result, {
    foo: {
      x: 1,
      y: 2,
    },
  });
});

test('throws an error if property type does not conform to zod object (invalid_type)', async (t) => {
  const pool = await createPool();

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

test('throws an error if result includes unknown property (unrecognized_keys)', async (t) => {
  const pool = await createPool();

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

  const query = sql.type(zodObject)`SELECT 1`;

  const error = await t.throwsAsync<SchemaValidationError>(pool.one(query));

  if (!error) {
    throw new Error('Expected SchemaValidationError');
  }

  t.is(error.issues.length, 1);
  t.is(error.issues[0]?.code, 'unrecognized_keys');
});
