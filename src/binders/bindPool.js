// @flow

import {
  mapTaggedTemplateLiteralInvocation
} from '../utilities';
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
import createPoolTransaction from '../factories/createPoolTransaction';
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

      const boundConnection = bindPoolConnection(parentLog, pool, connection, clientConfiguration);

      if (clientConfiguration.onConnect) {
        await clientConfiguration.onConnect(boundConnection);
      }

      let result;

      try {
        result = await connectionRoutine(boundConnection);
      } finally {
        const interceptors = clientConfiguration && clientConfiguration.interceptors || [];

        for (const interceptor of interceptors) {
          if (interceptor.beforePoolConnectionRelease) {
            await interceptor.beforePoolConnectionRelease(boundConnection);
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
