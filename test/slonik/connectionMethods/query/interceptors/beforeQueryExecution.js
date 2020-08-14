// @flow

import test from 'ava';
import createSqlTag from '../../../../../src/factories/createSqlTag';
import createPool from '../../../../helpers/createPool';

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
    command: 'SELECT',
    fields: [],
    notices: [],
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
        foo: 1,
      },
    ],
  });
});
