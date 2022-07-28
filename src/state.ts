import {
  type DeferredPromise,
} from 'p-defer';
import {
  type Pool as PgPool,
  type PoolClient as PgClientPool,
} from 'pg';
import {
  UnexpectedStateError,
} from './errors';
import {
  type TypeOverrides,
} from './types';

type PoolState = {
  ended: boolean,
  mock: boolean,
  poolId: string,
  typeOverrides: Promise<TypeOverrides> | null,
};

type PoolClientState = {
  activeQuery?: DeferredPromise<unknown>,
  connectionId: string,
  mock: boolean,
  poolId: string,
  terminated: Error | null,
  transactionDepth: number | null,
  transactionId: string | null,
};

export const poolStateMap = new WeakMap<PgPool, PoolState>();

export const poolClientStateMap = new WeakMap<PgClientPool, PoolClientState>();

export const getPoolState = (pool: PgPool): PoolState => {
  const poolState = poolStateMap.get(pool);

  if (!poolState) {
    throw new UnexpectedStateError('Pool state is unavailable.');
  }

  return poolState;
};

export const getPoolClientState = (poolClient: PgClientPool): PoolClientState => {
  const poolClientState = poolClientStateMap.get(poolClient);

  if (!poolClientState) {
    throw new UnexpectedStateError('Pool Client state is unavailable.');
  }

  return poolClientState;
};
