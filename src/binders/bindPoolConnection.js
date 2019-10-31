// @flow

import {
  mapTaggedTemplateLiteralInvocation,
} from '../utilities';
import type {
  ClientConfigurationType,
  DatabasePoolConnectionType,
  InternalDatabaseConnectionType,
  LoggerType,
  TransactionFunctionType,
} from '../types';
import {
  any,
  anyFirst,
  copyFromBinary,
  many,
  manyFirst,
  maybeOne,
  maybeOneFirst,
  one,
  oneFirst,
  query,
  stream,
  transaction,
} from '../connectionMethods';
import {
  assertSqlSqlToken,
} from '../assertions';

export default (
  parentLog: LoggerType,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
): DatabasePoolConnectionType => {
  return {
    any: mapTaggedTemplateLiteralInvocation(any.bind(null, parentLog, connection, clientConfiguration)),
    anyFirst: mapTaggedTemplateLiteralInvocation(anyFirst.bind(null, parentLog, connection, clientConfiguration)),
    copyFromBinary: async (copyQuery, values, columnTypes) => {
      assertSqlSqlToken(copyQuery);

      return copyFromBinary(
        parentLog,
        connection,
        clientConfiguration,
        copyQuery.sql,
        copyQuery.values,
        values,
        columnTypes,
      );
    },
    many: mapTaggedTemplateLiteralInvocation(many.bind(null, parentLog, connection, clientConfiguration)),
    manyFirst: mapTaggedTemplateLiteralInvocation(manyFirst.bind(null, parentLog, connection, clientConfiguration)),
    maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, parentLog, connection, clientConfiguration)),
    maybeOneFirst: mapTaggedTemplateLiteralInvocation(maybeOneFirst.bind(null, parentLog, connection, clientConfiguration)),
    one: mapTaggedTemplateLiteralInvocation(one.bind(null, parentLog, connection, clientConfiguration)),
    oneFirst: mapTaggedTemplateLiteralInvocation(oneFirst.bind(null, parentLog, connection, clientConfiguration)),
    query: mapTaggedTemplateLiteralInvocation(query.bind(null, parentLog, connection, clientConfiguration)),
    stream: async (streamQuery, streamHandler) => {
      assertSqlSqlToken(streamQuery);

      return stream(
        parentLog,
        connection,
        clientConfiguration,
        streamQuery.sql,
        streamQuery.values,
        streamHandler,
      );
    },
    transaction: async (handler: TransactionFunctionType) => {
      return transaction(
        parentLog,
        connection,
        clientConfiguration,
        handler,
      );
    },
  };
};
