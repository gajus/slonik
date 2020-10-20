// @flow

import {
  Logger,
} from '../Logger';
import {
  bindPool,
} from '../binders/bindPool';
import type {
  ClientConfigurationInputType,
  DatabasePoolType,
  PrimitiveValueExpressionType,
  QueryResultRowType,
  QueryResultType,
} from '../types';
import {
  createUlid,
} from '../utilities';
import {
  createClientConfiguration,
} from './createClientConfiguration';

type OverridesType = {
  readonly query: (sql: string, values: ReadonlyArray<PrimitiveValueExpressionType>) => Promise<QueryResultType<QueryResultRowType>>;
};

export const createMockPool = (
  overrides: OverridesType,
  clientConfigurationInput?: ClientConfigurationInputType,
): DatabasePoolType => {
  const clientConfiguration = createClientConfiguration(clientConfigurationInput);

  const poolId = createUlid();

  const poolLog = Logger.child({
    poolId,
  });

  const pool = {
    connect: () => {
      const connection = {
        connection: {
          slonik: {
            connectionId: createUlid(),
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
