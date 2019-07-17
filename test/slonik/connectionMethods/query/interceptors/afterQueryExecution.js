// @flow

import test from 'ava';
import createSqlTag from '../../../../../src/factories/createSqlTag';
import createPool from '../../../../helpers/createPool';

const sql = createSqlTag();

test('overrides results', async (t) => {
  const pool = createPool({
    interceptors: [
      {
        afterQueryExecution: () => {
          return {
            command: 'SELECT',
            fields: [],
            notices: [],
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
    notices: [],
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
