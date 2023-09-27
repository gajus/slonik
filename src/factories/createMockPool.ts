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
import { type Pool as PgPool, type PoolClient as PgClientPool } from 'pg';

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
      } as unknown as PgClientPool;

      return connection;
    },
    end: async () => {},
  } as unknown as PgPool;

  poolStateMap.set(pool, {
    ended: false,
    mock: true,
    poolId,
    typeOverrides: null,
  });

  return bindPool(poolLog, pool, clientConfiguration);
};
