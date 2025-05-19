import { createRaqSqlToken as raw } from './createRaqSqlToken.js';
import { createTestRunner } from './helpers.test/createTestRunner.js';
import { createPool, sql } from 'slonik';

const { test } = createTestRunner();

test('constructs raw SQL token', async (t) => {
  const pool = await createPool(t.context.dsn);

  const rows = await pool.any(sql.unsafe`
    SELECT 1 "id"
    UNION
    ${raw('SELECT 2 id')}
  `);

  t.deepEqual(rows, [
    {
      id: 1,
    },
    {
      id: 2,
    },
  ]);

  await pool.end();
});

test('constructs raw SQL token with value bindings', async (t) => {
  const pool = await createPool(t.context.dsn);

  const rows = await pool.any(sql.unsafe`
    SELECT 1 "id"
    UNION
    ${raw('SELECT $1 id', [2])}
  `);

  t.deepEqual(rows, [
    {
      id: 1,
    },
    {
      id: 2,
    },
  ]);

  await pool.end();
});

test('constructs raw SQL token with value bindings (offset)', async (t) => {
  const pool = await createPool(t.context.dsn);

  const rows = await pool.any(sql.unsafe`
    SELECT ${1}::int4 "id"
    UNION
    ${raw('SELECT $1 id', [2])}
  `);

  t.deepEqual(rows, [
    {
      id: 1,
    },
    {
      id: 2,
    },
  ]);

  await pool.end();
});

test('constructs raw SQL token with named value bindings', async (t) => {
  const pool = await createPool(t.context.dsn);

  const rows = await pool.any(sql.unsafe`
    SELECT 1 "id"
    UNION
    ${raw('SELECT :id id', {
      id: 2,
    })}
  `);

  t.deepEqual(rows, [
    {
      id: 1,
    },
    {
      id: 2,
    },
  ]);

  await pool.end();
});

test('constructs raw SQL token with named value bindings (offset)', async (t) => {
  const pool = await createPool(t.context.dsn);

  const rows = await pool.any(sql.unsafe`
    SELECT ${1}::int4 "id"
    UNION
    ${raw('SELECT :id id', {
      id: 2,
    })}
  `);

  t.deepEqual(rows, [
    {
      id: 1,
    },
    {
      id: 2,
    },
  ]);

  await pool.end();
});
