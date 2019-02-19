// @flow

import {
  mapTaggedTemplateLiteralInvocation
} from '../utilities';
import type {
  ClientConfigurationType,
  TransactionFunctionType,
  DatabasePoolConnectionType,
  InternalDatabaseConnectionType,
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
  query,
  transaction
} from '../connectionMethods';

export default (
  parentLog: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType
): DatabasePoolConnectionType => {
  return {
    any: mapTaggedTemplateLiteralInvocation(any.bind(null, parentLog, connection, clientConfiguration)),
    anyFirst: mapTaggedTemplateLiteralInvocation(anyFirst.bind(null, parentLog, connection, clientConfiguration)),
    many: mapTaggedTemplateLiteralInvocation(many.bind(null, parentLog, connection, clientConfiguration)),
    manyFirst: mapTaggedTemplateLiteralInvocation(manyFirst.bind(null, parentLog, connection, clientConfiguration)),
    maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, parentLog, connection, clientConfiguration)),
    maybeOneFirst: mapTaggedTemplateLiteralInvocation(maybeOneFirst.bind(null, parentLog, connection, clientConfiguration)),
    one: mapTaggedTemplateLiteralInvocation(one.bind(null, parentLog, connection, clientConfiguration)),
    oneFirst: mapTaggedTemplateLiteralInvocation(oneFirst.bind(null, parentLog, connection, clientConfiguration)),
    query: mapTaggedTemplateLiteralInvocation(query.bind(null, parentLog, connection, clientConfiguration)),
    transaction: async (handler: TransactionFunctionType) => {
      return transaction(parentLog, connection, clientConfiguration, handler);
    }
  };
};
