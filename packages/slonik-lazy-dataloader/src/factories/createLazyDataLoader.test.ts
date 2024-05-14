import { createLazyDataLoader } from './createLazyDataLoader';
import { createTestRunner } from './helpers.test/createTestRunner';
import { createPool, sql } from 'slonik';
import { z } from 'zod';

const { test } = createTestRunner();

test('fetches a single query', async (t) => {
  const pool = await createPool(t.context.dsn);

  const lazy = await createLazyDataLoader(pool);

  const result = await lazy.one(sql.type(
    z.object({
      id: z.number(),
    }),
  )`
    SELECT 1 AS id
  `);

  t.deepEqual(result, {
    id: 1,
  });
});

test('fetches multiple queries', async (t) => {
  const pool = await createPool(t.context.dsn);

  const lazy = await createLazyDataLoader(pool);

  const [a, b] = await Promise.all([
    lazy.one(sql.type(
      z.object({
        id: z.number(),
      }),
    )`
      SELECT 1 AS id
    `),
    lazy.one(sql.type(
      z.object({
        id: z.number(),
      }),
    )`
      SELECT 2 AS id
    `),
  ]);

  t.deepEqual(a, {
    id: 1,
  });

  t.deepEqual(b, {
    id: 2,
  });
});
