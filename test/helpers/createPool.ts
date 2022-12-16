import EventEmitter from 'events';
import * as sinon from 'sinon';
import {
  bindPool,
} from '../../src/binders/bindPool';
import {
  poolStateMap,
} from '../../src/state';
import {
  type ClientConfigurationInput,
} from '../../src/types';
import {
  Logger as log,
} from './Logger';

const defaultConfiguration = {
  interceptors: [],
  typeParsers: [],
};

export const createPool = async (clientConfiguration: ClientConfigurationInput = defaultConfiguration) => {
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
  } as any;

  poolStateMap.set(internalPool, {
    ended: false,
    mock: false,
    poolId: '1',
    typeOverrides: null,
  });

  const connectSpy: sinon.SinonSpy = sinon.spy(internalPool, 'connect');
  const endSpy: sinon.SinonSpy = sinon.spy(connection, 'end');
  const querySpy: sinon.SinonStub = sinon.stub(connection, 'query').returns({});
  const releaseSpy: sinon.SinonSpy = sinon.spy(connection, 'release');
  const removeSpy: sinon.SinonSpy = sinon.spy(internalPool, '_remove');

  const pool = bindPool(
    log,
    internalPool,
    {
      captureStackTrace: false,
      connectionRetryLimit: 1,
      connectionTimeout: 5_000,
      idleInTransactionSessionTimeout: 5_000,
      idleTimeout: 5_000,
      interceptors: [],
      maximumPoolSize: 1,
      queryRetryLimit: 1,
      statementTimeout: 5_000,
      transactionRetryLimit: 1,
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
