import type {
  PoolClient as PgPoolClient,
} from 'pg';
import {
  assertSqlSqlToken,
} from '../assertions';
import {
  any,
  anyFirst,
  copyFromBinary,
  exists,
  many,
  manyFirst,
  maybeOne,
  maybeOneFirst,
  one,
  oneFirst,
  query as queryMethod,
  stream,
  transaction,
} from '../connectionMethods';
import type {
  ClientConfiguration,
  DatabasePoolConnection,
  Logger,
} from '../types';

export const bindPoolConnection = (
  parentLog: Logger,
  connection: PgPoolClient,
  clientConfiguration: ClientConfiguration,
): DatabasePoolConnection => {
  return {
    any: (query) => {
      assertSqlSqlToken(query);

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

      return anyFirst(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
      );
    },
    copyFromBinary: (query, values, columnTypes) => {
      assertSqlSqlToken(query);

      return copyFromBinary(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
        values,
        columnTypes,
      );
    },
    exists: (query) => {
      assertSqlSqlToken(query);

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

      return queryMethod(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
      );
    },
    stream: (query, streamHandler, config) => {
      assertSqlSqlToken(query);

      return stream(
        parentLog,
        connection,
        clientConfiguration,
        query.sql,
        query.values,
        streamHandler,
        undefined,
        config,
      );
    },
    transaction: (handler, transactionRetryLimit) => {
      return transaction(
        parentLog,
        connection,
        clientConfiguration,
        handler,
        transactionRetryLimit,
      );
    },
  };
};
