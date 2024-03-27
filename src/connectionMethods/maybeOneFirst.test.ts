import { DataIntegrityError } from '../errors';
import { createPgPoolClientFactory } from '../factories/createPgPoolClientFactory';
import { createPool } from '../factories/createPool';
import { createSqlTag } from '../factories/createSqlTag';
import { createTestRunner } from '../helpers.test/createTestRunner';

const client = createPgPoolClientFactory();

const { test } = createTestRunner(client, 'pg');

const sql = createSqlTag();

test('returns the first row', async (t) => {
  const pool = await createPool(t.context.dsn, {
    client,
  });

  const result = await pool.maybeOneFirst(sql.unsafe`
    SELECT *
    FROM (VALUES (1)) as t(id)
  `);

  t.is(result, 1);
});

test('returns null if no results', async (t) => {
  const pool = await createPool(t.context.dsn, {
    client,
  });

  const result = await pool.maybeOneFirst(sql.unsafe`
    SELECT *
    FROM (VALUES (1)) as t(id)
    WHERE false
  `);

  t.is(result, null);
});

test('throws an error if more than one row is returned', async (t) => {
  const pool = await createPool(t.context.dsn, {
    client,
  });

  const error = await t.throwsAsync(
    pool.maybeOneFirst(sql.unsafe`
      SELECT *
      FROM (VALUES (1), (2)) as t(id)
    `),
  );

  t.true(error instanceof DataIntegrityError);
});

test('throws an error if more than one column is returned', async (t) => {
  const pool = await createPool(t.context.dsn, {
    client,
  });

  const error = await t.throwsAsync(
    pool.maybeOneFirst(sql.unsafe`
      SELECT *
      FROM (VALUES (1, 'foo')) as t(id, name)
    `),
  );

  t.true(error instanceof DataIntegrityError);
});
