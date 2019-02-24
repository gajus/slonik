// @flow

/* eslint-disable fp/no-events */

import EventEmitter from 'events';
import sinon from 'sinon';
import bindPool from '../../src/binders/bindPool';
import type {
  ClientUserConfigurationType
} from '../../src/types';
import log from './Logger';

const defaultConfiguration = {
  interceptors: [],
  typeParsers: []
};

export default (clientConfiguration: ClientUserConfigurationType = defaultConfiguration) => {
  const eventEmitter = new EventEmitter();

  const connection = {
    connection: {
      slonik: {
        connectionId: '1',
        poolId: '1',
        transactionDepth: null
      }
    },
    off: eventEmitter.off.bind(eventEmitter),
    on: eventEmitter.on.bind(eventEmitter),
    query: () => {
      return {};
    },
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
  const querySpy = sinon.stub(connection, 'query').returns({});

  const pool = bindPool(
    log,
    internalPool,
    {
      // @see https://github.com/facebook/flow/issues/7505
      // $FlowFixMe
      interceptors: [],

      // $FlowFixMe
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
