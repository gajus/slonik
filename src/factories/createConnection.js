// @flow

import type {
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
) => Promise<*>;
type PoolHandlerType = (pool: DatabasePoolType) => Promise<*>;

const createConnection = async (
  parentLog: LoggerType,
  pool: InternalDatabasePoolType,
  clientConfiguration: ClientConfigurationType,
  connectionType: ConnectionTypeType,
  connectionHandler: ConnectionHandlerType,
  poolHandler: PoolHandlerType,
  query?: TaggedTemplateLiteralInvocationType | null = null
): Promise<*> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      for (const interceptor of clientConfiguration.interceptors) {
        if (interceptor.beforePoolConnection) {
          const maybeNewPool = await interceptor.beforePoolConnection({
            log: parentLog,
            poolId: pool.slonik.poolId,
            query
          });

          if (maybeNewPool) {
            resolve(poolHandler(maybeNewPool));

            return;
          }
        }
      }

      let connection: InternalDatabaseConnectionType;

      try {
        connection = await pool.connect();
      } catch (error) {
        throw new ConnectionError(error.message);
      }

      connection.connection.slonik.rejectConnection = (error) => {
        connection.connection.slonik.terminated = true;

        reject(error);
      };

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
        await connection.release();

        throw error;
      }

      let result;

      try {
        result = await connectionHandler(connectionLog, connection, boundConnection, clientConfiguration);
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

      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

export default createConnection;
