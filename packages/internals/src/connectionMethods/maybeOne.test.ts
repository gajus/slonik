import { DataIntegrityError } from '../errors';
import { createPool } from '../factories/createPool';
import { createSqlTag } from '../factories/createSqlTag';
import { createTestDriverFactory } from '../factories/createTestDriverFactory';
import test from 'ava';

const driverFactory = createTestDriverFactory();

const sql = createSqlTag();

test('returns the first row', async (t) => {
  const pool = await createPool('postgres://', {
    driverFactory,
  });

  const result = await pool.maybeOne(sql.unsafe`
    SELECT *
    FROM (VALUES (1)) as t(id)
  `);

  t.deepEqual(result, {
    id: 1,
  });
});

test('returns null if no results', async (t) => {
  const pool = await createPool('postgres://', {
    driverFactory,
  });

  const result = await pool.maybeOne(sql.unsafe`
    SELECT *
    FROM (VALUES (1)) as t(id)
    WHERE false
  `);

  t.is(result, null);
});

test('throws an error if more than one row is returned', async (t) => {
  const pool = await createPool('postgres://', {
    driverFactory,
  });

  const error = await t.throwsAsync(
    pool.maybeOne(sql.unsafe`
    SELECT *
    FROM (VALUES (1), (2)) as t(id)
  `),
  );

  t.true(error instanceof DataIntegrityError);
});
