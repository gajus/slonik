// @flow

import pg from 'pg';
import serializeError from 'serialize-error';
import {
  parse as parseConnectionString
} from 'pg-connection-string';
import {
  createUlid
} from '../utilities';
import type {
  ClientUserConfigurationType,
  DatabasePoolType
} from '../types';
import Logger from '../Logger';
import bindPool from '../binders/bindPool';
import createClientConfiguration from './createClientConfiguration';

/**
 * @param connectionUri PostgreSQL [Connection URI](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING).
 */
export default (
  connectionUri: string,
  clientUserConfiguration?: ClientUserConfigurationType
): DatabasePoolType => {
  const clientConfiguration = createClientConfiguration(clientUserConfiguration);

  const poolId = createUlid();

  const poolLog = Logger.child({
    poolId
  });

  const poolConfiguration = parseConnectionString(connectionUri);

  if (clientConfiguration.connectionTimeout) {
    poolConfiguration.connectionTimeoutMillis = clientConfiguration.connectionTimeout;
  }

  if (clientConfiguration.idleTimeout) {
    poolConfiguration.idleTimeoutMillis = clientConfiguration.idleTimeout;
  }

  if (clientConfiguration.maximumPoolSize) {
    poolConfiguration.max = clientConfiguration.maximumPoolSize;
  }

  if (clientConfiguration.minimumPoolSize) {
    poolConfiguration.min = clientConfiguration.minimumPoolSize;
  }

  const pool = new pg.Pool(poolConfiguration);

  pool.slonik = {
    poolId
  };

  // istanbul ignore next
  pool.on('error', (error) => {
    if (error.client.connection.slonik.terminated !== true) {
      poolLog.error({
        error: serializeError(error)
      }, 'client connection error');
    }
  });

  // istanbul ignore next
  pool.on('connect', (client) => {
    client.connection.slonik = {
      connectionId: createUlid(),
      transactionDepth: null,
      typeParserSetupPromise: null
    };

    client.on('notice', (notice) => {
      poolLog.info({
        notice: {
          level: notice.name,
          message: notice.message
        }
      }, 'notice message');
    });

    poolLog.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'created a new client connection');
  });

  // istanbul ignore next
  pool.on('acquire', (client) => {
    poolLog.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'client is checked out from the pool');
  });

  // istanbul ignore next
  pool.on('remove', (client) => {
    poolLog.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'client connection is closed and removed from the client pool');
  });

  return bindPool(poolLog, pool, clientConfiguration);
};
