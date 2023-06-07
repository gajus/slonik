import { any } from '../connectionMethods/any';
import { anyFirst } from '../connectionMethods/anyFirst';
import { exists } from '../connectionMethods/exists';
import { many } from '../connectionMethods/many';
import { manyFirst } from '../connectionMethods/manyFirst';
import { maybeOne } from '../connectionMethods/maybeOne';
import { maybeOneFirst } from '../connectionMethods/maybeOneFirst';
import { one } from '../connectionMethods/one';
import { oneFirst } from '../connectionMethods/oneFirst';
import { query as queryMethod } from '../connectionMethods/query';
import { stream } from '../connectionMethods/stream';
import { transaction } from '../connectionMethods/transaction';
import {
  type ClientConfiguration,
  type DatabasePoolConnection,
  type Logger,
} from '../types';
import { type PoolClient as PgPoolClient } from 'pg';

export const bindPoolConnection = (
  parentLog: Logger,
  connection: PgPoolClient,
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
    stream: async (slonikSql, streamHandler, config) => {
      return await stream(
        parentLog,
        connection,
        clientConfiguration,
        slonikSql,
        streamHandler,
        undefined,
        config,
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
