import { ConnectionError, UnexpectedStateError } from '../errors';
import { getPoolState, poolClientStateMap } from '../state';
import { type Logger } from '../types';
import { createUid } from '../utilities/createUid';
import { type Pool as PgPool, type PoolClient as PgPoolClient } from 'pg';
import { serializeError } from 'serialize-error';

export const establishConnection = async (
  parentLog: Logger,
  pool: PgPool,
  connectionRetryLimit: number,
) => {
  const poolState = getPoolState(pool);

  let connection: PgPoolClient;

  let remainingConnectionRetryLimit = connectionRetryLimit + 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    remainingConnectionRetryLimit--;

    try {
      connection = await pool.connect();

      poolClientStateMap.set(connection, {
        connectionId: createUid(),
        mock: poolState.mock,
        poolId: poolState.poolId,
        terminated: null,
        transactionDepth: null,
        transactionId: null,
      });

      break;
    } catch (error) {
      parentLog.error(
        {
          error: serializeError(error),
          remainingConnectionRetryLimit,
        },
        'cannot establish connection',
      );

      if (remainingConnectionRetryLimit > 1) {
        parentLog.info('retrying connection');

        continue;
      } else {
        throw new ConnectionError(error.message, {
          cause: error,
        });
      }
    }
  }

  if (!connection) {
    throw new UnexpectedStateError('Connection handle is not present.');
  }

  return connection;
};
