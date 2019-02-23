// @flow

/* eslint-disable fp/no-events */

import sinon from 'sinon';
import bindPool from '../../src/binders/bindPool';
import type {
  ClientUserConfigurationType
} from '../../src/types';
import log from './Logger';

const defaultConfiguration = {
  interceptors: []
};

export default (clientConfiguration: ClientUserConfigurationType = defaultConfiguration) => {
  const connection = {
    connection: {
      slonik: {
        connectionId: '1',
        transactionDepth: null
      }
    },
    query: () => {},
    release: () => {}
  };

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
  const querySpy = sinon.spy(connection, 'query');

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
    querySpy,
    releaseSpy
  };
};
