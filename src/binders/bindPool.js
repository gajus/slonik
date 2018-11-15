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
import bindIsolatedPoolConnection from './bindIsolatedPoolConnection';
import bindPoolConnection from './bindPoolConnection';

export default (
  parentLog: LoggerType,
  pool: InternalDatabasePoolType,
  clientConfiguration: ClientConfigurationType
): DatabasePoolType => {
  return {
    any: mapTaggedTemplateLiteralInvocation(any.bind(null, parentLog, pool, clientConfiguration)),
    anyFirst: mapTaggedTemplateLiteralInvocation(anyFirst.bind(null, parentLog, pool, clientConfiguration)),

    // @see https://stackoverflow.com/questions/42539202/flowtype-how-can-i-overload-function-return-types-by-argument-count-types
    // eslint-disable-next-line consistent-return, flowtype/no-weak-types
    connect: async (handler): any => {
      if (handler) {
        const connection: InternalDatabaseConnectionType = await pool.connect();

        try {
          await handler(bindIsolatedPoolConnection(parentLog, pool, connection, clientConfiguration));
        } catch (error) {
          connection.release();

          throw error;
        }
      } else {
        const connection: InternalDatabaseConnectionType = await pool.connect();

        return bindPoolConnection(parentLog, pool, connection, clientConfiguration);
      }
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
