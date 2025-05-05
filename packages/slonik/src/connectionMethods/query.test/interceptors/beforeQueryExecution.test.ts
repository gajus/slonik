import { createPoolWithMockedQuery } from '../../../helpers.test/createPoolWithMockedQuery';
import { createTestRunner } from '../../../helpers.test/createTestRunner';
import { createPgDriverFactory } from '@slonik/pg-driver';
import { createSqlTag } from '@slonik/sql-tag';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

const sql = createSqlTag();

test('short-circuits the query execution', async (t) => {
  const { pool, query } = await createPoolWithMockedQuery(t.context.dsn, {
    driverFactory,
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
            type: 'QueryResult',
          };
        },
        name: 'foo',
      },
    ],
  });

  query.returns({
    rows: [
      {
        foo: 1,
      },
    ],
  });

  const result = await pool.query(sql.unsafe`SELECT 1`);

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
    type: 'QueryResult',
  });
});

test('executes query if "beforeQuery" does not return results', async (t) => {
  const { pool, query } = await createPoolWithMockedQuery(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        beforeQueryExecution: () => {
          return null;
        },
        name: 'foo',
      },
    ],
  });

  query.returns({
    command: 'SELECT',
    fields: [],
    notices: [],
    rowCount: 1,
    rows: [
      {
        foo: 1,
      },
    ],
    type: 'QueryResult',
  });

  const result = await pool.query(sql.unsafe`SELECT 1`);

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
    type: 'QueryResult',
  });
});
