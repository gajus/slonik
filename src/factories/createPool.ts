import {
  serializeError,
} from 'serialize-error';
import {
  Logger,
} from '../Logger';
import {
  bindPool,
} from '../binders/bindPool';
import {
  createUid,
} from '../utilities';
import {
  createClientConfiguration,
} from './createClientConfiguration';
import {
  createPoolConfiguration,
} from './createPoolConfiguration';
import type {
  ClientConfigurationInputType,
  DatabasePoolType,
} from '../types';
import type {
  EventEmitter,
} from 'events';
import type pgTypes from 'pg';

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

  let pgNativeBindingsAreAvailable = false;

  try {
    /* eslint-disable @typescript-eslint/no-require-imports, import/no-unassigned-import */
    require('pg-native');
    /* eslint-enable */

    pgNativeBindingsAreAvailable = true;

    poolLog.debug('found pg-native module');
  } catch {
    poolLog.debug('pg-native module is not found');
  }

  let pg: typeof pgTypes.native;
  let native = false;

  if (clientConfiguration.preferNativeBindings && pgNativeBindingsAreAvailable) {
    poolLog.info('using native libpq bindings');

    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    pg = require('pg').native;

    native = true;
  } else if (clientConfiguration.preferNativeBindings && !pgNativeBindingsAreAvailable) {
    poolLog.info('using JavaScript bindings; pg-native not found');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pg = require('pg');
  } else {
    poolLog.info('using JavaScript bindings');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pg = require('pg');
  }

  type ModifiedPool = EventEmitter & Omit<pgTypes.Pool, 'on'> & {
    slonik?: unknown,
  };
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pool: ModifiedPool = new pg!.Pool(poolConfiguration as unknown as pgTypes.PoolConfig);

  pool.slonik = {
    ended: false,
    mock: false,
    native,
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
      native,
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
