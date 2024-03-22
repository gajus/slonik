import { createSqlTag } from '../../../factories/createSqlTag';
import { createPool } from '../../../helpers/createPool';
import test from 'ava';

const sql = createSqlTag();

test('transforms query', async (t) => {
  const pool = await createPool({
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

  t.is(pool.querySpy.firstCall.args[0], 'SELECT 2');
});
