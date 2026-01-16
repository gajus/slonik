import { createPoolWithSpy } from '../../../helpers.test/createPoolWithSpy.js';
import { createTestRunner } from '../../../helpers.test/createTestRunner.js';
import { createPgDriverFactory } from '@slonik/pg-driver';
import { createSqlTag } from '@slonik/sql-tag';
import { z } from 'zod';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

const sql = createSqlTag();

test('transforms query', async (t) => {
  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        name: 'foo',
        transformQuery: (executionContext, query) => {
          return {
            ...query,
            sql: 'SELECT 2',
          };
        },
      },
    ],
  });

  await pool.query(sql.unsafe`SELECT 1`);

  t.is(spy.query.firstCall.args[0], 'SELECT 2');
});

test('passes statement name to driver for prepared statements', async (t) => {
  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
  });

  const ResultSchema = z.object({
    id: z.number(),
  });

  await pool.query(sql.prepared('my_prepared_statement', ResultSchema)`SELECT 1 AS id`);

  // Verify the statement name is passed as the third argument (queryOptions)
  t.deepEqual(spy.query.firstCall.args[2], { name: 'my_prepared_statement' });
});

test('does not pass queryOptions when statement name is not provided', async (t) => {
  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
  });

  await pool.query(sql.unsafe`SELECT 1`);

  // Verify queryOptions is undefined when no statement name is provided
  t.is(spy.query.firstCall.args[2], undefined);
});
