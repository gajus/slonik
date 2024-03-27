import { createPgDriver } from '../../../factories/createPgDriver';
import { createSqlTag } from '../../../factories/createSqlTag';
import { createPoolWithMockedQuery } from '../../../helpers.test/createPoolWithMockedQuery';
import { createTestRunner } from '../../../helpers.test/createTestRunner';

const driver = createPgDriver();

const { test } = createTestRunner(driver, 'pg');

const sql = createSqlTag();

test('short-circuits the query execution', async (t) => {
  const { pool, query } = await createPoolWithMockedQuery(t.context.dsn, {
    driver,
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
    driver,
    interceptors: [
      {
        beforeQueryExecution: () => {
          return null;
        },
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
