// @flow

import type {
  ClientConfigurationType,
  InternalDatabaseConnectionType,
  InternalDatabasePoolType,
  LoggerType,
  TransactionFunctionType
} from '../types';
import {
  setupTypeParsers
} from '../routines';
import {
  transaction
} from '../connectionMethods';
import {
  bindPoolConnection
} from '../binders';

export default async (
  parentLog: LoggerType,
  pool: InternalDatabasePoolType,
  clientConfiguration: ClientConfigurationType,
  handler: TransactionFunctionType
): Promise<*> => {
  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.beforePoolConnection) {
      const maybeNewPool = await interceptor.beforePoolConnection({
        log: parentLog,
        poolId: pool.slonik.poolId,
        query: null
      });

      if (maybeNewPool) {
        return maybeNewPool.transaction(handler);
      }
    }
  }

  const connection: InternalDatabaseConnectionType = await pool.connect();

  if (!connection.connection.slonik.typeParserSetupPromise) {
    connection.connection.slonik.typeParserSetupPromise = setupTypeParsers(connection, clientConfiguration.typeParsers);
  }

  await connection.connection.slonik.typeParserSetupPromise;

  const connectionId = connection.connection.slonik.connectionId;

  const connectionLog = parentLog.child({
    connectionId
  });

  const connectionContext = {
    connectionId,
    connectionType: 'IMPLICIT_TRANSACTION',
    log: connectionLog,
    poolId: pool.slonik.poolId
  };

  const boundConnection = bindPoolConnection(connectionLog, connection, clientConfiguration);

  try {
    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.afterPoolConnection) {
        await interceptor.afterPoolConnection(connectionContext, boundConnection);
      }
    }
  } catch (error) {
    await connection.release();

    throw error;
  }

  let result;

  try {
    result = await transaction(connectionLog, connection, clientConfiguration, handler);
  } catch (error) {
    await connection.release();

    throw error;
  }

  try {
    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.beforePoolConnectionRelease) {
        await interceptor.beforePoolConnectionRelease(connectionContext, boundConnection);
      }
    }
  } finally {
    await connection.release();
  }

  return result;
};
