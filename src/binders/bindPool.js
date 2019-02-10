// @flow

import type {
  ClientConfigurationType,
  DatabasePoolType,
  InternalDatabaseConnectionType,
  InternalDatabasePoolType,
  LoggerType
} from '../types';
import {
  any,
  anyFirst,
  many,
  manyFirst,
  maybeOne,
  maybeOneFirst,
  one,
  oneFirst,
  query
} from '../connectionMethods';
import {
  createUlid,
  mapTaggedTemplateLiteralInvocation
} from '../utilities';
import {
  createPoolTransaction
} from '../factories';
import bindPoolConnection from './bindPoolConnection';

export default (
  parentLog: LoggerType,
  pool: InternalDatabasePoolType,
  clientConfiguration: ClientConfigurationType
): DatabasePoolType => {
  return {
    any: mapTaggedTemplateLiteralInvocation(any.bind(null, parentLog, pool, clientConfiguration)),
    anyFirst: mapTaggedTemplateLiteralInvocation(anyFirst.bind(null, parentLog, pool, clientConfiguration)),
    connect: async (connectionRoutine) => {
      const connection: InternalDatabaseConnectionType = await pool.connect();

      const connectionLog = parentLog.child({
        connectionId: createUlid()
      });

      const connectionContext = {
        log: connectionLog
      };

      const boundConnection = bindPoolConnection(connectionLog, pool, connection, clientConfiguration);

      for (const interceptor of clientConfiguration.interceptors) {
        if (interceptor.afterPoolConnection) {
          await interceptor.afterPoolConnection(connectionContext, boundConnection);
        }
      }

      let result;

      try {
        result = await connectionRoutine(boundConnection);
      } finally {
        for (const interceptor of clientConfiguration.interceptors) {
          if (interceptor.beforePoolConnectionRelease) {
            await interceptor.beforePoolConnectionRelease(connectionContext, boundConnection);
          }
        }

        await connection.release();
      }

      return result;
    },
    many: mapTaggedTemplateLiteralInvocation(many.bind(null, parentLog, pool, clientConfiguration)),
    manyFirst: mapTaggedTemplateLiteralInvocation(manyFirst.bind(null, parentLog, pool, clientConfiguration)),
    maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, parentLog, pool, clientConfiguration)),
    maybeOneFirst: mapTaggedTemplateLiteralInvocation(maybeOneFirst.bind(null, parentLog, pool, clientConfiguration)),
    one: mapTaggedTemplateLiteralInvocation(one.bind(null, parentLog, pool, clientConfiguration)),
    oneFirst: mapTaggedTemplateLiteralInvocation(oneFirst.bind(null, parentLog, pool, clientConfiguration)),
    query: mapTaggedTemplateLiteralInvocation(query.bind(null, parentLog, pool, clientConfiguration)),
    transaction: async (handler) => {
      return createPoolTransaction(parentLog, pool, clientConfiguration, handler);
    }
  };
};
