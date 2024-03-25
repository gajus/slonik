import {
  type NativePostgresPool,
  type NativePostgresPoolClient,
} from './classes/NativePostgres';
import { UnexpectedStateError } from './errors';
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

export const poolStateMap = new WeakMap<NativePostgresPool, PoolState>();

export const poolClientStateMap = new WeakMap<
  NativePostgresPoolClient,
  PoolClientState
>();

export const getPoolState = (pool: NativePostgresPool): PoolState => {
  const poolState = poolStateMap.get(pool);

  if (!poolState) {
    throw new UnexpectedStateError('Pool state is unavailable.');
  }

  return poolState;
};

export const getPoolClientState = (
  poolClient: NativePostgresPoolClient,
): PoolClientState => {
  const poolClientState = poolClientStateMap.get(poolClient);

  if (!poolClientState) {
    throw new UnexpectedStateError('Pool Client state is unavailable.');
  }

  return poolClientState;
};
