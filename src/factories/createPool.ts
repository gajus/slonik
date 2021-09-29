import type {
  EventEmitter,
} from 'events';
import pgClient from 'pg';
import type pgTypes from 'pg';
import {
  serializeError,
} from 'serialize-error';
import {
  Logger,
} from '../Logger';
import {
  bindPool,
} from '../binders/bindPool';
import type {
  ClientConfigurationInputType,
  DatabasePoolType,
} from '../types';
import {
  createUid,
} from '../utilities';
import {
  createClientConfiguration,
} from './createClientConfiguration';
import {
  createPoolConfiguration,
} from './createPoolConfiguration';

/**
 * @param connectionUri PostgreSQL [Connection URI](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING).
 */
export const createPool = (
  connectionUri: string,
  clientConfigurationInput?: ClientConfigurationInputType,
): DatabasePoolType => {
  const clientConfiguration = createClientConfiguration(clientConfigurationInput);

  const poolId = createUid();

  const poolLog = Logger.child({
    poolId,
  });

  const poolConfiguration = createPoolConfiguration(connectionUri, clientConfiguration);

  let pg: Exclude<typeof pgTypes.native, null>;

  if (clientConfiguration.pgClient) {
    pg = clientConfiguration.pgClient;
  } else {
    pg = pgClient;
  }

  type ModifiedPool = EventEmitter & Omit<pgTypes.Pool, 'on'> & {
    slonik?: unknown,
  };

  const pool: ModifiedPool = new pg.Pool(poolConfiguration as unknown as pgTypes.PoolConfig);

  pool.slonik = {
    ended: false,
    mock: false,
    poolId,
    typeOverrides: null,
  };

  // istanbul ignore next
  pool.on('error', (error) => {
    if (!error.client.connection.slonik.terminated) {
      poolLog.error({
        error: serializeError(error),
      }, 'client connection error');
    }
  });

  // istanbul ignore next
  pool.on('connect', (client: EventEmitter & {connection: any, processID: string, }) => {
    client.connection = client.connection || {};

    client.connection.slonik = {
      connectionId: createUid(),
      mock: false,
      terminated: null,
      transactionDepth: null,
    };

    client.on('error', (error) => {
      if (error.message.includes('Connection terminated unexpectedly') || error.message.includes('server closed the connection unexpectedly')) {
        client.connection.slonik.terminated = error;
      }

      poolLog.error({
        error: serializeError(error),
      }, 'client error');
    });

    client.on('notice', (notice) => {
      poolLog.info({
        notice: {
          level: notice.name,
          message: notice.message,
        },
      }, 'notice message');
    });

    poolLog.debug({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount,
      },
    }, 'created a new client connection');
  });

  // istanbul ignore next
  pool.on('acquire', (client) => {
    poolLog.debug({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount,
      },
    }, 'client is checked out from the pool');
  });

  // istanbul ignore next
  pool.on('remove', (client) => {
    poolLog.debug({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount,
      },
    }, 'client connection is closed and removed from the client pool');
  });

  return bindPool(
    poolLog,
    pool,
    clientConfiguration,
  );
};
