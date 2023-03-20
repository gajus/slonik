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
  query as queryMethod,
  stream,
} from '../connectionMethods';
import { getPoolClientState } from '../state';
import {
  type ClientConfiguration,
  type DatabaseTransactionConnection,
  type Logger,
} from '../types';
import { type PoolClient as PgPoolClient } from 'pg';

export const bindTransactionConnection = (
  parentLog: Logger,
  connection: PgPoolClient,
  clientConfiguration: ClientConfiguration,
  transactionDepth: number,
): DatabaseTransactionConnection => {
  const poolClientState = getPoolClientState(connection);

  const assertTransactionDepth = () => {
    if (transactionDepth !== poolClientState.transactionDepth) {
      throw new Error('Cannot run a query using parent transaction.');
    }
  };

  return {
    any: (slonikSql) => {
      assertTransactionDepth();

      return any(parentLog, connection, clientConfiguration, slonikSql);
    },
    anyFirst: (slonikSql) => {
      assertTransactionDepth();

      return anyFirst(parentLog, connection, clientConfiguration, slonikSql);
    },
    exists: async (slonikSql) => {
      assertTransactionDepth();

      return await exists(
        parentLog,
        connection,
        clientConfiguration,
        slonikSql,
      );
    },
    many: (slonikSql) => {
      assertTransactionDepth();

      return many(parentLog, connection, clientConfiguration, slonikSql);
    },
    manyFirst: (slonikSql) => {
      assertTransactionDepth();

      return manyFirst(parentLog, connection, clientConfiguration, slonikSql);
    },
    maybeOne: (slonikSql) => {
      assertTransactionDepth();

      return maybeOne(parentLog, connection, clientConfiguration, slonikSql);
    },
    maybeOneFirst: (slonikSql) => {
      assertTransactionDepth();

      return maybeOneFirst(
        parentLog,
        connection,
        clientConfiguration,
        slonikSql,
      );
    },
    one: (slonikSql) => {
      assertTransactionDepth();

      return one(parentLog, connection, clientConfiguration, slonikSql);
    },
    oneFirst: (slonikSql) => {
      assertTransactionDepth();

      return oneFirst(parentLog, connection, clientConfiguration, slonikSql);
    },
    query: (slonikSql) => {
      assertTransactionDepth();

      return queryMethod(parentLog, connection, clientConfiguration, slonikSql);
    },
    stream: async (slonikSql, streamHandler) => {
      assertTransactionDepth();

      return await stream(
        parentLog,
        connection,
        clientConfiguration,
        slonikSql,
        streamHandler,
      );
    },
    transaction: async (handler, transactionRetryLimit) => {
      assertTransactionDepth();

      return await nestedTransaction(
        parentLog,
        connection,
        clientConfiguration,
        handler,
        transactionDepth,
        transactionRetryLimit,
      );
    },
  };
};
