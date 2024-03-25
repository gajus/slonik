import { bindPool } from '../binders/bindPool';
import {
  type NativePostgresPool,
  type NativePostgresPoolClient,
} from '../classes/NativePostgres';
import { Logger } from '../Logger';
import { poolStateMap } from '../state';
import {
  type ClientConfigurationInput,
  type DatabasePool,
  type MockPoolOverrides,
} from '../types';
import { createUid } from '../utilities/createUid';
import { createClientConfiguration } from './createClientConfiguration';

export const createMockPool = (
  overrides: MockPoolOverrides,
  clientConfigurationInput?: ClientConfigurationInput,
): DatabasePool => {
  const clientConfiguration = createClientConfiguration(
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
      } as unknown as NativePostgresPoolClient;

      return connection;
    },
    end: async () => {},
  } as unknown as NativePostgresPool;

  poolStateMap.set(pool, {
    ended: false,
    mock: true,
    poolId,
    typeOverrides: null,
  });

  return bindPool(poolLog, pool, clientConfiguration);
};
