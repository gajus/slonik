// @flow

/* eslint-disable fp/no-events */

import EventEmitter from 'events';
import sinon from 'sinon';
import bindPool from '../../src/binders/bindPool';
import type {
  ClientConfigurationInputType,
} from '../../src/types';
import log from './Logger';

const defaultConfiguration = {
  interceptors: [],
  typeParsers: [],
};

export default (clientConfiguration: ClientConfigurationInputType = defaultConfiguration) => {
  const eventEmitter = new EventEmitter();

  const connection = {
    connection: {
      slonik: {
        connectionId: '1',
        poolId: '1',
        transactionDepth: null,
      },
    },
    emit: eventEmitter.emit.bind(eventEmitter),
    end: () => {},
    off: eventEmitter.off.bind(eventEmitter),
    on: eventEmitter.on.bind(eventEmitter),
    query: () => {
      return {};
    },
    release: () => {},
  };

  const internalPool = {
    _remove: () => {},
    connect: () => {
      return connection;
    },
    slonik: {
      poolId: '1',
    },
  };

  const connectSpy = sinon.spy(internalPool, 'connect');
  const endSpy = sinon.spy(connection, 'end');
  const querySpy = sinon.stub(connection, 'query').returns({});
  const releaseSpy = sinon.spy(connection, 'release');
  const removeSpy = sinon.spy(internalPool, '_remove');

  const pool = bindPool(
    log,
    internalPool,

    // $FlowFixMe
    {
      // @see https://github.com/facebook/flow/issues/7505
      // $FlowFixMe
      interceptors: [],

      // $FlowFixMe
      typeParsers: [],
      ...clientConfiguration,
    },
  );

  return {
    ...pool,
    connection,
    connectSpy,
    endSpy,
    querySpy,
    releaseSpy,
    removeSpy,
  };
};
