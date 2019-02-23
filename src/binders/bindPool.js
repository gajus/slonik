// @flow

import type {
  ClientConfigurationType,
  ConnecionTypeType,
  DatabasePoolType,
  InternalDatabaseConnectionType,
  InternalDatabasePoolType,
  LoggerType,
  TaggedTemplateLiteralInvocationType
} from '../types';
import {
  createPoolTransaction
} from '../factories';
import {
  setupTypeParsers
} from '../routines';
import bindPoolConnection from './bindPoolConnection';

export default (
  parentLog: LoggerType,
  pool: InternalDatabasePoolType,
  clientConfiguration: ClientConfigurationType
): DatabasePoolType => {
  const internalConnect = async (connectionRoutine, query = null, connectionType: ConnecionTypeType) => {
    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.beforePoolConnection) {
        const maybeNewPool = await interceptor.beforePoolConnection({
          log: parentLog,
          poolId: pool.slonik.poolId,
          query
        });

        if (maybeNewPool) {
          return maybeNewPool.connect(connectionRoutine);
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
      result = await connectionRoutine(boundConnection);
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

  const mapConnection = (targetMethodName: string) => {
    return (query: TaggedTemplateLiteralInvocationType) => {
      if (typeof query === 'string') {
        throw new TypeError('Query must be constructed using `sql` tagged template literal.');
      }

      return internalConnect(
        (connection) => {
          return connection[targetMethodName](query);
        },
        query,
        'IMPLICIT_QUERY'
      );
    };
  };

  return {
    any: mapConnection('any'),
    anyFirst: mapConnection('anyFirst'),
    connect: (connectionRoutine) => {
      return internalConnect(connectionRoutine, null, 'EXPLICIT');
    },
    many: mapConnection('many'),
    manyFirst: mapConnection('manyFirst'),
    maybeOne: mapConnection('maybeOne'),
    maybeOneFirst: mapConnection('maybeOneFirst'),
    one: mapConnection('one'),
    oneFirst: mapConnection('oneFirst'),
    query: mapConnection('query'),
    transaction: async (handler) => {
      return createPoolTransaction(parentLog, pool, clientConfiguration, handler);
    }
  };
};
