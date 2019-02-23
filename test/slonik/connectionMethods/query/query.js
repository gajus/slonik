// @flow

import test from 'ava';
import createPool from '../../../helpers/createPool';
import sql from '../../../../src/templateTags/sql';

test('executes the query and returns the result', async (t) => {
  const pool = createPool();

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
        foo: 1
      }
    ]
  });
});
