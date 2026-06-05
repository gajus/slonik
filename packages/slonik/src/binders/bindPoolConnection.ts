import { any } from "../connectionMethods/any.js";
import { anyFirst } from "../connectionMethods/anyFirst.js";
import { exists } from "../connectionMethods/exists.js";
import { many } from "../connectionMethods/many.js";
import { manyFirst } from "../connectionMethods/manyFirst.js";
import { maybeOne } from "../connectionMethods/maybeOne.js";
import { maybeOneFirst } from "../connectionMethods/maybeOneFirst.js";
import { one } from "../connectionMethods/one.js";
import { oneFirst } from "../connectionMethods/oneFirst.js";
import { query as queryMethod } from "../connectionMethods/query.js";
import { record } from "../connectionMethods/record.js";
import { stream } from "../connectionMethods/stream.js";
import { transaction } from "../connectionMethods/transaction.js";
import type { ConnectionPoolClient } from "../factories/createConnectionPool.js";
import { getPoolClientState } from "../state.js";
import type { ClientConfiguration, DatabasePoolConnection, Logger } from "../types.js";

class BoundPoolConnection {
  parentLog: Logger;
  connection: ConnectionPoolClient;
  clientConfiguration: ClientConfiguration;

  constructor(
    parentLog: Logger,
    connection: ConnectionPoolClient,
    clientConfiguration: ClientConfiguration,
  ) {
    this.parentLog = parentLog;
    this.connection = connection;
    this.clientConfiguration = clientConfiguration;
  }

  get connectionId() {
    return getPoolClientState(this.connection).connectionId;
  }

  any(slonikSql) {
    return any(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  anyFirst(slonikSql) {
    return anyFirst(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  exists(slonikSql) {
    return exists(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  many(slonikSql) {
    return many(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  manyFirst(slonikSql) {
    return manyFirst(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  maybeOne(slonikSql) {
    return maybeOne(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  maybeOneFirst(slonikSql) {
    return maybeOneFirst(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  one(slonikSql) {
    return one(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  oneFirst(slonikSql) {
    return oneFirst(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  query(slonikSql) {
    return queryMethod(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  record(slonikSql) {
    return record(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  stream(slonikSql, streamHandler) {
    return stream(
      this.parentLog,
      this.connection,
      this.clientConfiguration,
      slonikSql,
      streamHandler,
      undefined,
    );
  }

  transaction(handler, transactionRetryLimit) {
    return transaction(
      this.parentLog,
      this.connection,
      this.clientConfiguration,
      handler,
      transactionRetryLimit,
    );
  }
}

export const bindPoolConnection = (
  parentLog: Logger,
  connection: ConnectionPoolClient,
  clientConfiguration: ClientConfiguration,
): DatabasePoolConnection => {
  return new BoundPoolConnection(
    parentLog,
    connection,
    clientConfiguration,
  ) as unknown as DatabasePoolConnection;
};
