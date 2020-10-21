import test from 'ava';
import sinon from 'sinon';
import {
  createSqlTag,
} from '../../../../../src/factories/createSqlTag';
import {
  createPool,
} from '../../../../helpers/createPool';

const sql = createSqlTag();

test('`afterPoolConnection` is called after `connect`', async (t) => {
  const afterPoolConnection = sinon.stub();

  const pool = createPool({
    interceptors: [
      {

      },
    ],
  });

  await pool.connect(() => {
    return Promise.resolve('foo');
  });

  t.assert(pool.connectSpy.calledBefore(afterPoolConnection));
});

test('`connectionType` is "EXPLICIT" when `connect` is used to create connection', async (t) => {
  const afterPoolConnection = sinon.stub();

  const pool = createPool({
    interceptors: [
      {
        afterPoolConnection,
      },
    ],
  });

  await pool.connect(() => {
    return Promise.resolve('foo');
  });

  t.assert(afterPoolConnection.firstCall.args[0].connectionType === 'EXPLICIT');
});

test('`connectionType` is "IMPLICIT_QUERY" when a query method is used to create a connection', async (t) => {
  const afterPoolConnection = sinon.stub();

  const pool = createPool({
    interceptors: [
      {
        afterPoolConnection,
      },
    ],
  });

  await pool.query(sql`SELECT 1`);

  t.assert(afterPoolConnection.firstCall.args[0].connectionType === 'IMPLICIT_QUERY');
});

test('`connectionType` is "IMPLICIT_TRANSACTION" when `transaction` is used to create a connection', async (t) => {
  const afterPoolConnection = sinon.stub();

  const pool = createPool({
    interceptors: [
      {
        afterPoolConnection,
      },
    ],
  });

  await pool.transaction(() => {
    return Promise.resolve('foo');
  });

  t.assert(afterPoolConnection.firstCall.args[0].connectionType === 'IMPLICIT_TRANSACTION');
});
