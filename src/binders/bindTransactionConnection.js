// @flow

import {
  any,
  anyFirst,
  exists,
  many,
  manyFirst,
  maybeOne,
  maybeOneFirst,
  nestedTransaction,
  one,
  oneFirst,
  query,
} from '../connectionMethods';
import type {
  ClientConfigurationType,
  DatabaseTransactionConnectionType,
  InternalDatabaseConnectionType,
  LoggerType,
  TaggedTemplateLiteralInvocationType,
  TransactionFunctionType,
} from '../types';
import {
  mapTaggedTemplateLiteralInvocation,
} from '../utilities';

export default (
  parentLog: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  transactionDepth: number,
): DatabaseTransactionConnectionType => {
  const mapInvocation = (fn) => {
    const bound = mapTaggedTemplateLiteralInvocation(fn);

    return (taggedQuery: TaggedTemplateLiteralInvocationType) => {
      if (transactionDepth !== connection.connection.slonik.transactionDepth) {
        return Promise.reject(new Error('Cannot run a query using parent transaction.'));
      }

      return bound(taggedQuery);
    };
  };

  return {
    any: mapInvocation(any.bind(null, parentLog, connection, clientConfiguration)),
    anyFirst: mapInvocation(anyFirst.bind(null, parentLog, connection, clientConfiguration)),
    exists: mapInvocation(exists.bind(null, parentLog, connection, clientConfiguration)),
    many: mapInvocation(many.bind(null, parentLog, connection, clientConfiguration)),
    manyFirst: mapInvocation(manyFirst.bind(null, parentLog, connection, clientConfiguration)),
    maybeOne: mapInvocation(maybeOne.bind(null, parentLog, connection, clientConfiguration)),
    maybeOneFirst: mapInvocation(maybeOneFirst.bind(null, parentLog, connection, clientConfiguration)),
    one: mapInvocation(one.bind(null, parentLog, connection, clientConfiguration)),
    oneFirst: mapInvocation(oneFirst.bind(null, parentLog, connection, clientConfiguration)),
    query: mapInvocation(query.bind(null, parentLog, connection, clientConfiguration)),
    transaction: (handler: TransactionFunctionType) => {
      return nestedTransaction(parentLog, connection, clientConfiguration, handler, transactionDepth);
    },
  };
};
