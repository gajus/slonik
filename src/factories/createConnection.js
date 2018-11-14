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
  ClientConfigurationType,
  DatabaseConfigurationType,
  DatabaseSingleConnectionType,
  InternalDatabaseConnectionType,
  InternalDatabasePoolType
} from '../types';
import Logger from '../Logger';
import bindSingleConnection from '../binders/bindSingleConnection';

// @see https://github.com/facebook/flow/issues/2977#issuecomment-390613203
const defaultClientConfiguration = Object.freeze({});

export default async (
  connectionConfiguration: DatabaseConfigurationType,
  clientConfiguration: ClientConfigurationType = defaultClientConfiguration
): Promise<DatabaseSingleConnectionType> => {
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

  connection.on('notice', (notice) => {
    connectionLog.info({
      notice
    }, 'notice message');
  });

  return bindSingleConnection(connectionLog, pool, connection, clientConfiguration);
};
