// @flow

import test from 'ava';
import sql from '../../../../../src/templateTags/sql';
import createPool from '../../../../helpers/createPool';

test('transforms query', async (t) => {
  const pool = createPool({
    interceptors: [
      {
        transformQuery: (executionContext, query) => {
          return {
            ...query,
            sql: 'SELECT 2'
          };
        }
      }
    ]
  });

  await pool.query(sql`SELECT 1`);

  t.true(pool.querySpy.firstCall.args[0] === 'SELECT 2');
});
