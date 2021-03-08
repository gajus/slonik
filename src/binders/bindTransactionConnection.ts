import {
  assertSqlSqlToken,
} from '../assertions';
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
  stream,
  query as queryMethod,
} from '../connectionMethods';
import type {
  ClientConfigurationType,
  DatabaseTransactionConnectionType,
  InternalDatabaseConnectionType,
  Logger,
} from '../types';

export const bindTransactionConnection = (
  parentLog: Logger,
  connection: InternalDatabaseConnectionType,
  clientConfiguration: ClientConfigurationType,
  transactionDepth: number,
): DatabaseTransactionConnectionType => {
  const assertTransactionDepth = () => {
    if (transactionDepth !== connection.connection.slonik.transactionDepth) {
      throw new Error('Cannot run a query using parent transaction.');
    }
  };

  return {
    any: (query) => {
      assertSqlSqlToken(query);
      assertTransactionDepth();

      return any(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
      );
    },
    anyFirst: (query) => {
      assertSqlSqlToken(query);
      assertTransactionDepth();

      return anyFirst(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
      );
    },
    exists: (query) => {
      assertSqlSqlToken(query);
      assertTransactionDepth();

      return exists(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
      );
    },
    many: (query) => {
      assertSqlSqlToken(query);
      assertTransactionDepth();

      return many(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
      );
    },
    manyFirst: (query) => {
      assertSqlSqlToken(query);
      assertTransactionDepth();

      return manyFirst(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
      );
    },
    maybeOne: (query) => {
      assertSqlSqlToken(query);
      assertTransactionDepth();

      return maybeOne(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
      );
    },
    maybeOneFirst: (query) => {
      assertSqlSqlToken(query);
      assertTransactionDepth();

      return maybeOneFirst(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
      );
    },
    one: (query) => {
      assertSqlSqlToken(query);
      assertTransactionDepth();

      return one(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
      );
    },
    oneFirst: (query) => {
      assertSqlSqlToken(query);
      assertTransactionDepth();

      return oneFirst(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
      );
    },
    query: (query) => {
      assertSqlSqlToken(query);
      assertTransactionDepth();

      return queryMethod(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
      );
    },
    stream: (query, streamHandler) => {
      assertSqlSqlToken(query);
      assertTransactionDepth();

      return stream(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
        streamHandler,
      );
    },
    transaction: (handler) => {
      assertTransactionDepth();

      return nestedTransaction(
        parentLog,
        connection,
        clientConfiguration,
        handler,
        transactionDepth,
      );
    },
  };
};
