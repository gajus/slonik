// @flow

import test from 'ava';
import createSqlTag from '../../../../../src/factories/createSqlTag';
import createPool from '../../../../helpers/createPool';

const sql = createSqlTag();

test('transforms query', async (t) => {
  const pool = createPool({
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

  await pool.query(sql`SELECT 1`);

  t.assert(pool.querySpy.firstCall.args[0] === 'SELECT 2');
});
