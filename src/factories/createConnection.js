// @flow

import pg from 'pg';
import serializeError from 'serialize-error';
import {
  parse as parseConnectionString
} from 'pg-connection-string';
import {
  createUlid,
  formatNotice
} from '../utilities';
import type {
  ClientUserConfigurationType,
  DatabaseConfigurationType,
  DatabaseSingleConnectionType,
  InternalDatabaseConnectionType,
  InternalDatabasePoolType
} from '../types';
import Logger from '../Logger';
import bindSingleConnection from '../binders/bindSingleConnection';
import createClientConfiguration from './createClientConfiguration';

export default async (
  connectionConfiguration: DatabaseConfigurationType,
  clientUserConfiguration?: ClientUserConfigurationType
): Promise<DatabaseSingleConnectionType> => {
  const clientConfiguration = createClientConfiguration(clientUserConfiguration);

  const pool: InternalDatabasePoolType = new pg.Pool(typeof connectionConfiguration === 'string' ? parseConnectionString(connectionConfiguration) : connectionConfiguration);

  const connectionLog = Logger.child({
    connectionId: createUlid()
  });

  pool.on('error', (error) => {
    connectionLog.error({
      error: serializeError(error)
    }, 'client connection error');
  });

  pool.on('connect', (client) => {
    client.on('notice', (notice) => {
      connectionLog.info({
        notice: formatNotice(notice)
      }, 'notice message');
    });

    connectionLog.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'created a new client connection');
  });

  pool.on('acquire', (client) => {
    connectionLog.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'client is checked out from the pool');
  });

  pool.on('remove', (client) => {
    connectionLog.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'client connection is closed and removed from the client pool');
  });

  const connection: InternalDatabaseConnectionType = await pool.connect();

  const boundConnection = bindSingleConnection(connectionLog, pool, connection, clientConfiguration);

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.afterConnection) {
      await interceptor.afterConnection(boundConnection);
    }
  }

  return boundConnection;
};
