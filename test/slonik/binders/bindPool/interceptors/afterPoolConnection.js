// @flow

import test from 'ava';
import sinon from 'sinon';
import sql from '../../../../../src/templateTags/sql';
import bindPool from '../../../../../src/binders/bindPool';
import log from '../../../../helpers/Logger';

const createConnection = () => {
  return {
    connection: {
      slonik: {
        connectionId: '1',
        transactionDepth: null
      }
    },
    query: () => {},
    release: () => {}
  };
};

const createPool = (clientConfiguration = {}) => {
  const connection = createConnection();

  const internalPool = {
    connect: () => {
      return connection;
    },
    slonik: {
      poolId: '1'
    }
  };

  const connectSpy = sinon.spy(internalPool, 'connect');
  const releaseSpy = sinon.spy(connection, 'release');

  const pool = bindPool(
    log,
    internalPool,
    {
      interceptors: [],
      typeParsers: [],
      ...clientConfiguration
    }
  );

  return {
    ...pool,
    connectSpy,
    releaseSpy
  };
};

test('`afterPoolConnection` is called after `connect`', async (t) => {
  const afterPoolConnection = sinon.stub();

  const pool = createPool({
    interceptors: [
      {

      }
    ]
  });

  await pool.connect(() => {
    return Promise.resolve('foo');
  });

  t.true(pool.connectSpy.calledBefore(afterPoolConnection));
});

test('`connectionType` is "EXPLICIT" when `connect` is used to create connection', async (t) => {
  const afterPoolConnection = sinon.stub();

  const pool = createPool({
    interceptors: [
      {
        afterPoolConnection
      }
    ]
  });

  await pool.connect(() => {
    return Promise.resolve('foo');
  });

  t.true(afterPoolConnection.firstCall.args[0].connectionType === 'EXPLICIT');
});

test('`connectionType` is "IMPLICIT_QUERY" when a query method is used to create a connection', async (t) => {
  const afterPoolConnection = sinon.stub();

  const pool = createPool({
    interceptors: [
      {
        afterPoolConnection
      }
    ]
  });

  await pool.query(sql`SELECT 1`);

  t.true(afterPoolConnection.firstCall.args[0].connectionType === 'IMPLICIT_QUERY');
});

test('`connectionType` is "IMPLICIT_TRANSACTION" when `transaction` is used to create a connection', async (t) => {
  const afterPoolConnection = sinon.stub();

  const pool = createPool({
    interceptors: [
      {
        afterPoolConnection
      }
    ]
  });

  await pool.transaction(() => {
    return Promise.resolve('foo');
  });

  t.true(afterPoolConnection.firstCall.args[0].connectionType === 'IMPLICIT_TRANSACTION');
});
