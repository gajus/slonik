// @flow

import type {
  MaybePromiseType,
  ClientConfigurationType,
  ConnectionTypeType,
  DatabasePoolType,
  DatabasePoolConnectionType,
  InternalDatabaseConnectionType,
  InternalDatabasePoolType,
  LoggerType,
  TaggedTemplateLiteralInvocationType
} from '../types';
import {
  setupTypeParsers
} from '../routines';
import {
  bindPoolConnection
} from '../binders';
import {
  ConnectionError
} from '../errors';

type ConnectionHandlerType = (
  connectionLog: LoggerType,
  connection: InternalDatabaseConnectionType,
  boundConnection: DatabasePoolConnectionType,
  clientConfiguration: ClientConfigurationType
) => MaybePromiseType<*>;

type PoolHandlerType = (pool: DatabasePoolType) => Promise<*>;

const createConnection = async (
  parentLog: LoggerType,
  pool: InternalDatabasePoolType,
  clientConfiguration: ClientConfigurationType,
  connectionType: ConnectionTypeType,
  connectionHandler: ConnectionHandlerType,
  poolHandler: PoolHandlerType,
  query?: TaggedTemplateLiteralInvocationType | null = null
) => {
  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.beforePoolConnection) {
      const maybeNewPool = await interceptor.beforePoolConnection({
        log: parentLog,
        poolId: pool.slonik.poolId,
        query
      });

      if (maybeNewPool) {
        return poolHandler(maybeNewPool);
      }
    }
  }

  let connection: InternalDatabaseConnectionType;

  try {
    connection = await pool.connect();
  } catch (error) {
    throw new ConnectionError(error.message);
  }

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
    connectionType,
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
    pool._remove(connection);

    throw error;
  }

  let result;

  try {
    result = await connectionHandler(connectionLog, connection, boundConnection, clientConfiguration);
  } catch (error) {
    pool._remove(connection);

    throw error;
  }

  try {
    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.beforePoolConnectionRelease) {
        await interceptor.beforePoolConnectionRelease(connectionContext, boundConnection);
      }
    }
  } catch (error) {
    pool._remove(connection);

    throw error;
  }

  await connection.release();

  return result;
};

export default createConnection;
