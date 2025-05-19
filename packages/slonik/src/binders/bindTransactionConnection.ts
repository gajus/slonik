import { any } from '../connectionMethods/any.js';
import { anyFirst } from '../connectionMethods/anyFirst.js';
import { exists } from '../connectionMethods/exists.js';
import { many } from '../connectionMethods/many.js';
import { manyFirst } from '../connectionMethods/manyFirst.js';
import { maybeOne } from '../connectionMethods/maybeOne.js';
import { maybeOneFirst } from '../connectionMethods/maybeOneFirst.js';
import { nestedTransaction } from '../connectionMethods/nestedTransaction.js';
import { one } from '../connectionMethods/one.js';
import { oneFirst } from '../connectionMethods/oneFirst.js';
import { query as queryMethod } from '../connectionMethods/query.js';
import { stream } from '../connectionMethods/stream.js';
import type { ConnectionPoolClient } from '../factories/createConnectionPool.js';
import { getPoolClientState } from '../state.js';
import type {
  ClientConfiguration,
  DatabaseTransactionConnection,
  Logger,
} from '../types.js';

export const bindTransactionConnection = (
  parentLog: Logger,
  connection: ConnectionPoolClient,
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
