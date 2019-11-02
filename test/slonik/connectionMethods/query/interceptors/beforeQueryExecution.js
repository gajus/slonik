// @flow

import test from 'ava';
import createPool from '../../../../helpers/createPool';
import createSqlTag from '../../../../../src/factories/createSqlTag';

const sql = createSqlTag();

test('short-circuits the query execution', async (t) => {
  const pool = createPool({
    interceptors: [
      {
        beforeQueryExecution: () => {
          return {
            command: 'SELECT',
            fields: [],
            notices: [],
            oid: null,
            rowAsArray: false,
            rowCount: 1,
            rows: [
              {
                foo: 2,
              },
            ],
          };
        },
      },
    ],
  });

  pool.querySpy.returns({
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
    oid: null,
    rowAsArray: false,
    rowCount: 1,
    rows: [
      {
        foo: 2,
      },
    ],
  });
});

test('executes query if "beforeQuery" does not return results', async (t) => {
  const pool = createPool({
    interceptors: [
      {
        beforeQueryExecution: () => {
          return null;
        },
      },
    ],
  });

  pool.querySpy.returns({
    rows: [
      {
        foo: 1,
      },
    ],
  });

  const result = await pool.query(sql`SELECT 1`);

  t.deepEqual(result, {
    notices: [],
    rows: [
      {
        foo: 1,
      },
    ],
  });
});
