import { createPgDriverFactory } from '../../factories/createPgDriverFactory';
import { createPool } from '../../factories/createPool';
import { createSqlTag } from '../../factories/createSqlTag';
import { createErrorWithCode } from '../../helpers.test/createErrorWithCode';
import { createTestRunner } from '../../helpers.test/createTestRunner';
import * as sinon from 'sinon';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

export const createErrorWithCodeAndConstraint = (code: string) => {
  const error = createErrorWithCode(code);

  // @ts-expect-error – This is a test helper.
  error.constraint = 'foo';

  return error;
};

const sql = createSqlTag();

test('ends connection after promise is resolved (explicit connection)', async (t) => {
  const eventHandler = sinon.spy();

  process.on('warning', eventHandler);

  const pool = await createPool(t.context.dsn, { driverFactory });

  await pool.connect(async (connection) => {
    let queryCount = 20;

    const queries: Array<Promise<unknown>> = [];

    while (queryCount-- > 0) {
      queries.push(connection.query(sql.unsafe`SELECT 1`));
    }

    await Promise.all(queries);
  });

  t.false(eventHandler.called);
});

test('executes the query and returns the result', async (t) => {
  const pool = await createPool(t.context.dsn, { driverFactory });

  const result = await pool.query(sql.unsafe`
    SELECT *
    FROM (VALUES (1)) as t(id)
  `);

  t.deepEqual(result, {
    command: 'SELECT',
    fields: [
      {
        dataTypeId: 23,
        name: 'id',
      },
    ],
    notices: [],
    rowCount: 1,
    rows: [
      {
        id: 1,
      },
    ],
    type: 'QueryResult',
  });
});
