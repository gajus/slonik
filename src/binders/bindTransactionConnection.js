// @flow

import {
  mapTaggedTemplateLiteralInvocation
} from '../utilities';
import {
  any,
  anyFirst,
  many,
  manyFirst,
  maybeOne,
  maybeOneFirst,
  nestedTransaction,
  one,
  oneFirst,
  query
} from '../connectionMethods';
import type {
  ClientConfigurationType,
  DatabaseTransactionConnectionType,
  InternalDatabaseConnectionType,
  LoggerType,
  TransactionFunctionType
} from '../types';

export default (
  parentLog: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  transactionDepth: number
): DatabaseTransactionConnectionType => {
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
    transaction: (handler: TransactionFunctionType) => {
      return nestedTransaction(parentLog, connection, clientConfiguration, handler, transactionDepth);
    }
  };
};
