import { any } from '../connectionMethods/any.js';
import { anyFirst } from '../connectionMethods/anyFirst.js';
import { exists } from '../connectionMethods/exists.js';
import { many } from '../connectionMethods/many.js';
import { manyFirst } from '../connectionMethods/manyFirst.js';
import { maybeOne } from '../connectionMethods/maybeOne.js';
import { maybeOneFirst } from '../connectionMethods/maybeOneFirst.js';
import { one } from '../connectionMethods/one.js';
import { oneFirst } from '../connectionMethods/oneFirst.js';
import { query as queryMethod } from '../connectionMethods/query.js';
import { stream } from '../connectionMethods/stream.js';
import { transaction } from '../connectionMethods/transaction.js';
import { type ConnectionPoolClient } from '../factories/createConnectionPool.js';
import {
  type ClientConfiguration,
  type DatabasePoolConnection,
  type Logger,
} from '../types.js';

export const bindPoolConnection = (
  parentLog: Logger,
  connection: ConnectionPoolClient,
  clientConfiguration: ClientConfiguration,
): DatabasePoolConnection => {
  return {
    any: (slonikSql) => {
      return any(parentLog, connection, clientConfiguration, slonikSql);
    },
    anyFirst: (slonikSql) => {
      return anyFirst(parentLog, connection, clientConfiguration, slonikSql);
    },
    exists: async (slonikSql) => {
      return await exists(
        parentLog,
        connection,
        clientConfiguration,
        slonikSql,
      );
    },
    many: (slonikSql) => {
      return many(parentLog, connection, clientConfiguration, slonikSql);
    },
    manyFirst: (slonikSql) => {
      return manyFirst(parentLog, connection, clientConfiguration, slonikSql);
    },
    maybeOne: (slonikSql) => {
      return maybeOne(parentLog, connection, clientConfiguration, slonikSql);
    },
    maybeOneFirst: (slonikSql) => {
      return maybeOneFirst(
        parentLog,
        connection,
        clientConfiguration,
        slonikSql,
      );
    },
    one: (slonikSql) => {
      return one(parentLog, connection, clientConfiguration, slonikSql);
    },
    oneFirst: (slonikSql) => {
      return oneFirst(parentLog, connection, clientConfiguration, slonikSql);
    },
    query: (slonikSql) => {
      return queryMethod(parentLog, connection, clientConfiguration, slonikSql);
    },
    stream: async (slonikSql, streamHandler) => {
      return await stream(
        parentLog,
        connection,
        clientConfiguration,
        slonikSql,
        streamHandler,
        undefined,
      );
    },
    transaction: async (handler, transactionRetryLimit) => {
      return await transaction(
        parentLog,
        connection,
        clientConfiguration,
        handler,
        transactionRetryLimit,
      );
    },
  };
};
