import { ConnectionError, UnexpectedStateError } from '../errors';
import {
  type ConnectionPool,
  type ConnectionPoolClient,
} from '../factories/createConnectionPool';
import { poolClientStateMap } from '../state';
import { type Logger } from '../types';
import { createUid } from '../utilities/createUid';
import { serializeError } from 'serialize-error';

export const establishConnection = async (
  parentLog: Logger,
  pool: ConnectionPool,
  connectionRetryLimit: number,
) => {
  let connection: ConnectionPoolClient;

  let remainingConnectionRetryLimit = connectionRetryLimit + 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    remainingConnectionRetryLimit--;

    try {
      connection = await pool.acquire();

      poolClientStateMap.set(connection, {
        connectionId: createUid(),
        poolId: pool.id(),
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
