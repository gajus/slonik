import { UnexpectedStateError } from './errors';
import {
  type ConnectionPool,
  type ConnectionPoolClient,
} from './factories/createConnectionPool';
import { type TypeOverrides } from './types';
import { type DeferredPromise } from './utilities/defer';

export type PoolState = {
  ended: boolean;
  mock: boolean;
  poolId: string;
  typeOverrides: Promise<TypeOverrides> | null;
};

type PoolClientState = {
  activeQuery?: DeferredPromise<null>;
  connectionId: string;
  mock: boolean;
  poolId: string;
  terminated: Error | null;
  transactionDepth: number | null;
  transactionId: string | null;
};

export const poolStateMap = new WeakMap<ConnectionPool, PoolState>();

export const poolClientStateMap = new WeakMap<
  ConnectionPoolClient,
  PoolClientState
>();

export const getPoolState = (pool: ConnectionPool): PoolState => {
  const poolState = poolStateMap.get(pool);

  if (!poolState) {
    throw new UnexpectedStateError('Pool state is unavailable.');
  }

  return poolState;
};

export const getPoolClientState = (
  poolClient: ConnectionPoolClient,
): PoolClientState => {
  const poolClientState = poolClientStateMap.get(poolClient);

  if (!poolClientState) {
    throw new UnexpectedStateError('Pool Client state is unavailable.');
  }

  return poolClientState;
};
