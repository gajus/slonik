import { bindPool } from '../binders/bindPool';
import { Logger } from '../Logger';
import { poolStateMap } from '../state';
import {
  type ClientConfigurationInput,
  type DatabasePool,
  type MockPoolOverrides,
} from '../types';
import { createUid } from '../utilities/createUid';
import { createClientConfiguration } from './createClientConfiguration';
import {
  type ConnectionPool,
  type ConnectionPoolClient,
} from './createConnectionPool';

export const createMockPool = (
  overrides: MockPoolOverrides,
  clientConfigurationInput?: ClientConfigurationInput,
): DatabasePool => {
  const clientConfiguration = createClientConfiguration(
    'postgres://',
    clientConfigurationInput,
  );

  const poolId = createUid();

  const poolLog = Logger.child({
    poolId,
  });

  const pool = {
    connect: () => {
      const connection = {
        off: () => {},
        on: () => {},
        query: overrides.query,
        release: () => {},
      } as unknown as ConnectionPoolClient;

      return connection;
    },
    end: async () => {},
  } as unknown as ConnectionPool;

  poolStateMap.set(pool, {
    ended: false,
    mock: true,
    poolId,
    typeOverrides: null,
  });

  return bindPool(poolLog, pool, clientConfiguration);
};
