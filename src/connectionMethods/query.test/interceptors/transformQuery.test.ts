import { createPgDriver } from '../../../factories/createPgDriver';
import { createSqlTag } from '../../../factories/createSqlTag';
import { createPoolWithSpy } from '../../../helpers.test/createPoolWithSpy';
import { createTestRunner } from '../../../helpers.test/createTestRunner';

const driver = createPgDriver();

const { test } = createTestRunner(driver, 'pg');

const sql = createSqlTag();

test('transforms query', async (t) => {
  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driver,
    interceptors: [
      {
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
