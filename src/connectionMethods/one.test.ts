import { DataIntegrityError, NotFoundError } from '../errors';
import { createPgDriverFactory } from '../factories/createPgDriverFactory';
import { createPool } from '../factories/createPool';
import { createSqlTag } from '../factories/createSqlTag';
import { createTestRunner } from '../helpers.test/createTestRunner';
import { expectTypeOf } from 'expect-type';
import { z } from 'zod';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

const sql = createSqlTag();

test('returns the first row', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const result = await pool.one(sql.unsafe`
    SELECT *
    FROM (VALUES (1)) as t(id)
  `);

  t.deepEqual(result, {
    id: 1,
  });
});

test('throws an error if no rows are returned', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const error = await t.throwsAsync(
    pool.one(sql.unsafe`
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
    pool.one(sql.unsafe`
      SELECT *
      FROM (VALUES (1), (2)) as t(id)
    `),
  );

  t.true(error instanceof DataIntegrityError);
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

  const result = await pool.one(query);

  expectTypeOf(result).toMatchTypeOf<{ id: number }>();

  t.deepEqual(result, {
    id: 1,
  });
});
