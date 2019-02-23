// @flow

import test from 'ava';
import sinon from 'sinon';
import bindPool from '../../../../../src/binders/bindPool';
import log from '../../../../helpers/Logger';

const createConnection = () => {
  return {
    connection: {
      slonik: {
        connectionId: '1'
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

test('`beforePoolConnection` is called before `connect`', async (t) => {
  const beforePoolConnection = sinon.stub();

  const pool = createPool({
    interceptors: [
      {
        beforePoolConnection
      }
    ]
  });

  await pool.connect(() => {
    return Promise.resolve('foo');
  });

  t.true(beforePoolConnection.calledBefore(pool.connectSpy));
});
