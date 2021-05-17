import {
  Logger,
} from '../Logger';
import {
  bindPool,
} from '../binders/bindPool';
import {
  createUid,
} from '../utilities';
import {
  createClientConfiguration,
} from './createClientConfiguration';
import type {
  ClientConfigurationInputType,
  DatabasePoolType,
  PrimitiveValueExpressionType,
  QueryResultRowType,
  QueryResultType,
} from '../types';

type OverridesType = {
  readonly query: (sql: string, values: readonly PrimitiveValueExpressionType[]) => Promise<QueryResultType<QueryResultRowType>>,
};

export const createMockPool = (
  overrides: OverridesType,
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
