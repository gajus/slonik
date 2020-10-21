/* eslint-disable fp/no-events */

import EventEmitter from 'events';
import sinon from 'sinon';
import {
  bindPool,
} from '../../src/binders/bindPool';
import type {
  ClientConfigurationInputType,
} from '../../src/types';
import {
  Logger as log,
} from './Logger';

const defaultConfiguration = {
  interceptors: [],
  typeParsers: [],
};

export const createPool = (clientConfiguration: ClientConfigurationInputType = defaultConfiguration) => {
  // @ts-expect-error
  const eventEmitter = new EventEmitter();

  const connection = {
    connection: {
      slonik: {
        connectionId: '1',
        mock: false,
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
    _pulseQueue: () => {},
    _remove: () => {},
    connect: () => {
      return connection;
    },
    slonik: {
      ended: false,
      mock: false,
      poolId: '1',
    },
  };

  const connectSpy: sinon.SinonSpy = sinon.spy(internalPool, 'connect');
  const endSpy: sinon.SinonSpy = sinon.spy(connection, 'end');
  const querySpy: sinon.SinonStub = sinon.stub(connection, 'query').returns({});
  const releaseSpy: sinon.SinonSpy = sinon.spy(connection, 'release');
  const removeSpy: sinon.SinonSpy = sinon.spy(internalPool, '_remove');

  const pool = bindPool(
    log,
    internalPool,

    // @ts-expect-error
    {
      // @see https://github.com/facebook/flow/issues/7505
      interceptors: [],

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
