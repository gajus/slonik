import { UnexpectedStateError } from './errors';
import { type ConnectionPoolClient } from './factories/createConnectionPool';
import { type DeferredPromise } from './utilities/defer';

type PoolClientState = {
  activeQuery?: DeferredPromise<null>;
  connectionId: string;
  poolId: string;
  terminated: Error | null;
  transactionDepth: number | null;
  transactionId: string | null;
};

export const poolClientStateMap = new WeakMap<
  ConnectionPoolClient,
  PoolClientState
>();

export const getPoolClientState = (
  poolClient: ConnectionPoolClient,
): PoolClientState => {
  const poolClientState = poolClientStateMap.get(poolClient);

  if (!poolClientState) {
    throw new UnexpectedStateError('Pool Client state is unavailable.');
  }

  return poolClientState;
};
