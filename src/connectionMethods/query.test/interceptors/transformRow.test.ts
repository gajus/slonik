import { createPgPoolClientFactory } from '../../../factories/createPgPoolClientFactory';
import { createSqlTag } from '../../../factories/createSqlTag';
import { createPoolWithMockedQuery } from '../../../helpers.test/createPoolWithMockedQuery';
import { createTestRunner } from '../../../helpers.test/createTestRunner';

const client = createPgPoolClientFactory();

const { test } = createTestRunner(client, 'pg');

const sql = createSqlTag();

test('overrides result row (sync)', async (t) => {
  const { pool, query } = await createPoolWithMockedQuery(t.context.dsn, {
    client,
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
    client,
    interceptors: [
      {
        transformRow: () => {
          return Promise.resolve({
            foo: 2,
          });
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
