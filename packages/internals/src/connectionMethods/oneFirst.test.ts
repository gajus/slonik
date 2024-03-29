import {
  DataIntegrityError,
  NotFoundError,
  UnexpectedStateError,
} from '../errors';
import { createPgDriverFactory } from '../factories/createPgDriverFactory';
import { createPool } from '../factories/createPool';
import { createSqlTag } from '../factories/createSqlTag';
import { createTestRunner } from '../helpers.test/createTestRunner';
import { expectTypeOf } from 'expect-type';
import { z } from 'zod';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

const sql = createSqlTag();

test('returns value of the first column from the first row', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const result = await pool.oneFirst(sql.unsafe`
    SELECT *
    FROM (VALUES (1)) as t(id)
  `);

  t.is(result, 1);
});

test('throws an error if no rows are returned', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const error = await t.throwsAsync(
    pool.oneFirst(sql.unsafe`
      SELECT *
      FROM (VALUES (1)) as t(id)
      WHERE false
    `),
  );

  t.true(error instanceof NotFoundError);
});

test('throws an error if more than one row is returned', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const error = await t.throwsAsync(
    pool.oneFirst(sql.unsafe`
      SELECT *
      FROM (VALUES (1), (2)) as t(id)  
    `),
  );

  t.true(error instanceof DataIntegrityError);
});

test('throws an error if more than one column is returned', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const error = await t.throwsAsync(
    pool.oneFirst(sql.unsafe`
      SELECT *
      FROM (VALUES (1, 'foo')) as t(id, name)
    `),
  );

  t.true(error instanceof UnexpectedStateError);
});

test('describes zod object associated with the query', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const zodObject = z.object({
    id: z.number(),
  });

  const query = sql.type(zodObject)`
    SELECT *
    FROM (VALUES (1)) as t(id)
  `;

  const result = await pool.oneFirst(query);

  expectTypeOf(result).toMatchTypeOf<number>();

  t.is(result, 1);
});
