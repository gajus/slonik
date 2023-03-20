import { bindPoolConnection } from '../binders';
import { ConnectionError, UnexpectedStateError } from '../errors';
import { getPoolClientState, getPoolState, poolClientStateMap } from '../state';
import {
  type ClientConfiguration,
  type Connection,
  type DatabasePool,
  type DatabasePoolConnection,
  type Logger,
  type MaybePromise,
  type QuerySqlToken,
} from '../types';
import { createUid } from '../utilities';
import { type Pool as PgPool, type PoolClient as PgPoolClient } from 'pg';
import { serializeError } from 'serialize-error';

type ConnectionHandlerType = (
  connectionLog: Logger,
  connection: PgPoolClient,
  boundConnection: DatabasePoolConnection,
  clientConfiguration: ClientConfiguration,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => MaybePromise<any>;

type PoolHandlerType = (pool: DatabasePool) => Promise<unknown>;

const terminatePoolConnection = (connection: PgPoolClient) => {
  // tells the pool to destroy this client
  connection.release(true);
};

const destroyBoundConnection = (boundConnection: DatabasePoolConnection) => {
  const boundConnectionMethods = [
    'any',
    'anyFirst',
    'copyFromBinary',
    'exists',
    'many',
    'manyFirst',
    'maybeOne',
    'maybeOneFirst',
    'one',
    'oneFirst',
    'query',
    'stream',
    'transaction',
  ];

  for (const boundConnectionMethod of boundConnectionMethods) {
    boundConnection[boundConnectionMethod] = async () => {
      throw new Error('Cannot use released connection');
    };
  }
};

export const createConnection = async (
  parentLog: Logger,
  pool: PgPool,
  clientConfiguration: ClientConfiguration,
  connectionType: Connection,
  connectionHandler: ConnectionHandlerType,
  poolHandler: PoolHandlerType,
  query: QuerySqlToken | null = null,
) => {
  const poolState = getPoolState(pool);

  if (poolState.ended) {
    throw new UnexpectedStateError(
      'Connection pool shutdown has been already initiated. Cannot create a new connection.',
    );
  }

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.beforePoolConnection) {
      const maybeNewPool = await interceptor.beforePoolConnection({
        log: parentLog,
        poolId: poolState.poolId,
        query,
      });

      if (maybeNewPool) {
        return await poolHandler(maybeNewPool);
      }
    }
  }

  let connection: PgPoolClient;

  let remainingConnectionRetryLimit = clientConfiguration.connectionRetryLimit;

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
        throw new ConnectionError(error.message);
      }
    }
  }

  if (!connection) {
    throw new UnexpectedStateError('Connection handle is not present.');
  }

  const poolClientState = getPoolClientState(connection);

  const { connectionId } = poolClientState;

  const connectionLog = parentLog.child({
    connectionId,
  });

  const connectionContext = {
    connectionId,
    connectionType,
    log: connectionLog,
    poolId: poolState.poolId,
  };

  const boundConnection = bindPoolConnection(
    connectionLog,
    connection,
    clientConfiguration,
  );

  try {
    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.afterPoolConnection) {
        await interceptor.afterPoolConnection(
          connectionContext,
          boundConnection,
        );
      }
    }
  } catch (error) {
    terminatePoolConnection(connection);

    throw error;
  }

  let result;

  try {
    result = await connectionHandler(
      connectionLog,
      connection,
      boundConnection,
      clientConfiguration,
    );
  } catch (error) {
    terminatePoolConnection(connection);

    throw error;
  }

  try {
    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.beforePoolConnectionRelease) {
        await interceptor.beforePoolConnectionRelease(
          connectionContext,
          boundConnection,
        );
      }
    }
  } catch (error) {
    terminatePoolConnection(connection);

    throw error;
  }

  destroyBoundConnection(boundConnection);

  connection.release();

  return result;
};
