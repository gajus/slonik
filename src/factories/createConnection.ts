import type {
  Pool as PgPool,
  PoolClient as PgPoolClient,
} from 'pg';
import {
  serializeError,
} from 'serialize-error';
import {
  bindPoolConnection,
} from '../binders';
import {
  ConnectionError,
  UnexpectedStateError,
} from '../errors';
import {
  createTypeOverrides,
} from '../routines';
import {
  getPoolClientState,
  getPoolState,
  poolClientStateMap,
} from '../state';
import type {
  MaybePromise,
  ClientConfiguration,
  Connection,
  DatabasePool,
  DatabasePoolConnection,
  Logger,
  TaggedTemplateLiteralInvocation,
} from '../types';
import {
  createUid,
} from '../utilities';

type ConnectionHandlerType = (
  connectionLog: Logger,
  connection: PgPoolClient,
  boundConnection: DatabasePoolConnection,
  clientConfiguration: ClientConfiguration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) => MaybePromise<any>;

type PoolHandlerType = (pool: DatabasePool) => Promise<unknown>;

const terminatePoolConnection = (
  pool: PgPool,
  connection: PgPoolClient,
  error: Error,
) => {
  const poolState = getPoolState(pool);
  const poolClientState = getPoolClientState(connection);

  if (!poolClientState.terminated) {
    poolClientState.terminated = error;
  }

  if (poolState.mock) {
    return;
  }

  pool._remove(connection);
  pool._pulseQueue();
};

// eslint-disable-next-line complexity
export const createConnection = async (
  parentLog: Logger,
  pool: PgPool,
  clientConfiguration: ClientConfiguration,
  connectionType: Connection,
  connectionHandler: ConnectionHandlerType,
  poolHandler: PoolHandlerType,
  query: TaggedTemplateLiteralInvocation | null = null,
) => {
  const poolState = getPoolState(pool);

  if (poolState.ended) {
    throw new UnexpectedStateError('Connection pool shutdown has been already initiated. Cannot create a new connection.');
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
      parentLog.error({
        error: serializeError(error),
        remainingConnectionRetryLimit,
      }, 'cannot establish connection');

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

  if (!poolState.mock) {
    if (!poolState.typeOverrides) {
      poolState.typeOverrides = createTypeOverrides(
        connection,
        clientConfiguration.typeParsers,
      );
    }

    // eslint-disable-next-line canonical/id-match
    connection._types = await poolState.typeOverrides;
  }

  const poolClientState = getPoolClientState(connection);

  const {
    connectionId,
  } = poolClientState;

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
        await interceptor.afterPoolConnection(connectionContext, boundConnection);
      }
    }
  } catch (error) {
    terminatePoolConnection(pool, connection, error);

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
    terminatePoolConnection(pool, connection, error);

    throw error;
  }

  try {
    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.beforePoolConnectionRelease) {
        await interceptor.beforePoolConnectionRelease(connectionContext, boundConnection);
      }
    }
  } catch (error) {
    terminatePoolConnection(pool, connection, error);

    throw error;
  }

  if (
    poolState.mock === false &&
    poolState.ended === false && [
      'IMPLICIT_QUERY',
      'IMPLICIT_TRANSACTION',
    ].includes(connectionType)
  ) {
    connection.release();
  } else {
    // Do not use `connection.release()` for explicit connections:
    //
    // It is possible that user might mishandle connection release,
    // and same connection is going to end up being used by multiple
    // invocations of `pool.connect`, e.g.
    //
    // ```
    // pool.connect((connection1) => { setTimeout(() => { connection1; }, 1000) });
    // pool.connect((connection2) => { setTimeout(() => { connection2; }, 1000) });
    // ```
    //
    // In the above scenario, connection1 and connection2 are going to be the same connection.
    //
    // `pool._remove(connection)` ensures that we create a new connection for each `pool.connect()`.
    //
    // The downside of this approach is that we cannot leverage idle connection pooling.
    terminatePoolConnection(pool, connection, new ConnectionError('Forced connection termination (explicit connection).'));
  }

  return result;
};
