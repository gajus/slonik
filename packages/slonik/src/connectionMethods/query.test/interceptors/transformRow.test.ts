import { createPoolWithMockedQuery } from '../../../helpers.test/createPoolWithMockedQuery.js';
import { createTestRunner } from '../../../helpers.test/createTestRunner.js';
import { createPgDriverFactory } from '@slonik/pg-driver';
import { createSqlTag } from '@slonik/sql-tag';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

const sql = createSqlTag();

test('overrides result row (sync)', async (t) => {
  const { pool, query } = await createPoolWithMockedQuery(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        name: 'foo',
        transformRow: () => {
          return {
            foo: 2,
          };
        },
      },
    ],
  });

  query.returns({
    command: 'SELECT',
    fields: [],
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
        foo: 2,
      },
    ],
    type: 'QueryResult',
  });
});

test('overrides result row (async)', async (t) => {
  const { pool, query } = await createPoolWithMockedQuery(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        name: 'foo',
        transformRowAsync: async () => {
          return {
            foo: 2,
          };
        },
      },
    ],
  });

  query.returns({
    command: 'SELECT',
    fields: [],
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
        foo: 2,
      },
    ],
    type: 'QueryResult',
  });
});
