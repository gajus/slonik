import { createPgPoolClientFactory } from '../../../factories/createPgPoolClientFactory';
import { createSqlTag } from '../../../factories/createSqlTag';
import { createPoolWithSpy } from '../../../helpers.test/createPoolWithSpy';
import { createTestRunner } from '../../../helpers.test/createTestRunner';

const client = createPgPoolClientFactory();

const { test } = createTestRunner(client, 'pg');

const sql = createSqlTag();

test('transforms query', async (t) => {
  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    client,
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
