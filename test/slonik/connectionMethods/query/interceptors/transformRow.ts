// @flow

import test from 'ava';
import {
  createSqlTag,
} from '../../../../../src/factories/createSqlTag';
import {
  createPool,
} from '../../../../helpers/createPool';

const sql = createSqlTag();

test('overrides result row', async (t) => {
  const pool = createPool({
    interceptors: [
      {
        transformRow: () => {
          return {
            foo: 2,
          };
        },
      },
    ],
  });

  pool.querySpy.returns({
    command: 'SELECT',
    fields: [],
    rowCount: 1,
    rows: [
      {
        foo: 1,
      },
    ],
  });

  const result = await pool.query(sql`SELECT 1`);

  t.deepEqual(result, {
    command: 'SELECT',
    fields: [],
    notices: [],
    rowCount: 1,
    rows: [
      {
        foo: 2,
      },
    ],
  });
});
