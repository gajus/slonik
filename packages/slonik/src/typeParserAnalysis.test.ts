import { createTestRunner } from './helpers.test/createTestRunner.js';
import { createPool, sql } from './index.js';
import { createPgDriverFactory } from '@slonik/pg-driver';

const driverFactory = createPgDriverFactory();
const { test } = createTestRunner(driverFactory, 'pg');

test('parallel fetches to verify non-blocking typeParser', async (t) => {
  let lastParsedId = 0;
  let parsingOutOfOrder = false;

  const pool = await createPool(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        name: 'result-parser',
        transformRowAsync: async (executionContext, actualQuery, row) => {
          if (row.id !== lastParsedId + 1) {
            parsingOutOfOrder = true;
          }

          lastParsedId = Number(row.id);
          return row;
        },
      },
    ],
    typeParsers: [],
  });

  // Insert 2000 records into the person table
  await pool.query(sql.unsafe`
    INSERT INTO person (name)
    SELECT 'person_' || generate_series
    FROM generate_series(1, 2000)
  `);

  await Promise.allSettled([
    // Fetch A: IDs 1-1000
    pool.many(sql.unsafe`
      SELECT id, name
      FROM person
      WHERE id BETWEEN 1 AND 1000
      ORDER BY id
    `),
    // Fetch B: IDs 1001-2000
    pool.many(sql.unsafe`
      SELECT id, name
      FROM person
      WHERE id BETWEEN 1001 AND 2000
      ORDER BY id
    `),
  ]);

  await pool.end();

  t.is(
    parsingOutOfOrder,
    true,
    'transformRowAsync should happen asynchronously',
  );
});
