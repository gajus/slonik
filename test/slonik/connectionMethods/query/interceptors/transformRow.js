// @flow

import test from 'ava';
import sql from '../../../../../src/templateTags/sql';
import createPool from '../../../../helpers/createPool';

test('overrides result row', async (t) => {
  const pool = createPool({
    interceptors: [
      {
        transformRow: () => {
          return {
            foo: 2
          };
        }
      }
    ]
  });

  pool.querySpy.returns({
    rows: [
      {
        foo: 1
      }
    ]
  });

  const result = await pool.query(sql`SELECT 1`);

  t.deepEqual(result, {
    notices: [],
    rows: [
      {
        foo: 2
      }
    ]
  });
});
