import {
  Logger,
} from '../Logger';
import {
  bindPool,
} from '../binders/bindPool';
import type {
  ClientConfigurationInputType,
  DatabasePoolType,
  MockPoolOverridesType,
  PrimitiveValueExpressionType,
  QueryResultRowType,
  QueryResultType,
} from '../types';
import {
  createUid,
} from '../utilities';
import {
  createClientConfiguration,
} from './createClientConfiguration';

export const createMockPool = (
  overrides: MockPoolOverridesType,
  clientConfigurationInput?: ClientConfigurationInputType,
): DatabasePoolType => {
  const clientConfiguration = createClientConfiguration(clientConfigurationInput);

  const poolId = createUid();

  const poolLog = Logger.child({
    poolId,
  });

  const pool = {
    connect: () => {
      const connection = {
        connection: {
          slonik: {
            connectionId: createUid(),
            mock: true,
            terminated: null,
            transactionDepth: null,
          },
        },
        off: () => {},
        on: () => {},
        query: overrides.query,
        release: () => {},
      };

      return connection;
    },
    slonik: {
      ended: false,
      mock: true,
      poolId,
      typeOverrides: null,
    },
  };

  return bindPool(
    poolLog,
    pool,
    clientConfiguration,
  );
};
