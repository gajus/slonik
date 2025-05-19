import { createPoolWithSpy } from '../../../helpers.test/createPoolWithSpy.js';
import { createTestRunner } from '../../../helpers.test/createTestRunner.js';
import { createPgDriverFactory } from '@slonik/pg-driver';
import { createSqlTag } from '@slonik/sql-tag';

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
