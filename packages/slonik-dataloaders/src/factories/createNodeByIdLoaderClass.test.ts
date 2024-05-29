import { createNodeByIdLoaderClass } from './createNodeByIdLoaderClass.js';
import { createPool, type DatabasePool, sql } from 'slonik';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const POSTGRES_DSN =
  // eslint-disable-next-line n/no-process-env
  process.env.POSTGRES_DSN ?? 'postgres://postgres:postgres@localhost:5432';

const FooByIdLoader = createNodeByIdLoaderClass({
  query: sql.type(
    z.object({
      id: z.number(),
      uid: z.string(),
    }),
  )`
    SELECT
      *
    FROM test_table_foo
  `,
});

describe('createRecordByUniqueColumnLoader', () => {
  let pool: DatabasePool;

  beforeAll(async () => {
    pool = await createPool(POSTGRES_DSN);

    await pool.query(sql.unsafe`
      CREATE TABLE IF NOT EXISTS test_table_foo (
        id integer NOT NULL PRIMARY KEY,
        uid text NOT NULL
      );
    `);

    await pool.query(sql.unsafe`
      INSERT INTO test_table_foo
        (id, uid)
      VALUES
        (1, 'a'),
        (2, 'b'),
        (3, 'c');
    `);
  });

  afterAll(async () => {
    if (pool) {
      await pool.query(sql.unsafe`
        DROP TABLE IF EXISTS test_table_foo;
      `);

      await pool.end();
    }
  });

  it('loads record by numeric column', async () => {
    const loader = new FooByIdLoader(pool, {});
    const result = await loader.load(2);

    expect(result).toMatchObject({ id: 2, uid: 'b' });
  });

  it("returns null when a match can't be found", async () => {
    const loader = new FooByIdLoader(pool, {});
    const result = await loader.load(999);

    expect(result).toEqual(null);
  });

  it('batches and caches loaded records', async () => {
    const loader = new FooByIdLoader(pool, {});
    const poolAnySpy = vi.spyOn(pool, 'any');
    const results = await Promise.all([loader.load(3), loader.load(2)]);

    expect(poolAnySpy).toHaveBeenCalledTimes(1);
    expect(results).toMatchObject([
      { id: 3, uid: 'c' },
      { id: 2, uid: 'b' },
    ]);
  });

  it('loads record by text column', async () => {
    const FooByUidLoader = createNodeByIdLoaderClass({
      column: {
        name: 'uid',
        type: 'text',
      },
      query: sql.type(
        z.object({
          id: z.number(),
          uid: z.string(),
        }),
      )`
        SELECT
          *
        FROM test_table_foo
      `,
    });
    const loader = new FooByUidLoader(pool, {});
    const result = await loader.load('b');

    expect(result).toMatchObject({ id: 2, uid: 'b' });
  });
});
