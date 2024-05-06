import { createPgDriverFactory } from '../../../factories/createPgDriverFactory';
import { createPool } from '../../../factories/createPool';
import { createSqlTag } from '../../../factories/createSqlTag';
import { createPoolWithSpy } from '../../../helpers.test/createPoolWithSpy';
import { createTestRunner } from '../../../helpers.test/createTestRunner';
import * as sinon from 'sinon';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

const sql = createSqlTag();

test('`afterPoolConnection` is called after `connect`', async (t) => {
  const afterPoolConnection = sinon.stub();

  const { pool, spy } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
    interceptors: [{}],
  });

  await pool.connect(async () => {
    return 'foo';
  });

  t.true(spy.acquire.calledBefore(afterPoolConnection));
});

test('`connectionType` is "EXPLICIT" when `connect` is used to create connection', async (t) => {
  const afterPoolConnection = sinon.stub();

  const pool = await createPool(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        afterPoolConnection,
      },
    ],
  });

  await pool.connect(async () => {
    return 'foo';
  });

  t.is(afterPoolConnection.firstCall.args[0].connectionType, 'EXPLICIT');
});

test('`connectionType` is "IMPLICIT_QUERY" when a query method is used to create a connection', async (t) => {
  const afterPoolConnection = sinon.stub();

  const pool = await createPool(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        afterPoolConnection,
      },
    ],
  });

  await pool.query(sql.unsafe`SELECT 1`);

  t.is(afterPoolConnection.firstCall.args[0].connectionType, 'IMPLICIT_QUERY');
});

test('`connectionType` is "IMPLICIT_TRANSACTION" when `transaction` is used to create a connection', async (t) => {
  const afterPoolConnection = sinon.stub();

  const pool = await createPool(t.context.dsn, {
    driverFactory,
    interceptors: [
      {
        afterPoolConnection,
      },
    ],
  });

  await pool.transaction(async () => {
    return 'foo';
  });

  t.is(
    afterPoolConnection.firstCall.args[0].connectionType,
    'IMPLICIT_TRANSACTION',
  );
});
