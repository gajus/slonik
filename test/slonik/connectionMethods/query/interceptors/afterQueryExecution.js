// @flow

import test from 'ava';
import sql from '../../../../../src/templateTags/sql';
import createPool from '../../../../helpers/createPool';

test('overrides results', async (t) => {
  const pool = createPool({
    interceptors: [
      {
        afterQueryExecution: () => {
          return {
            command: 'SELECT',
            fields: [],
            oid: null,
            rowAsArray: false,
            rowCount: 1,
            rows: [
              {
                foo: 2
              }
            ]
          };
        }
      }
    ]
  });

  const result = await pool.query(sql`SELECT 1`);

  t.deepEqual(result, {
    command: 'SELECT',
    fields: [],
    oid: null,
    rowAsArray: false,
    rowCount: 1,
    rows: [
      {
        foo: 2
      }
    ]
  });
});
