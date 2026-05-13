import { any } from "../connectionMethods/any.js";
import { anyFirst } from "../connectionMethods/anyFirst.js";
import { exists } from "../connectionMethods/exists.js";
import { many } from "../connectionMethods/many.js";
import { manyFirst } from "../connectionMethods/manyFirst.js";
import { maybeOne } from "../connectionMethods/maybeOne.js";
import { maybeOneFirst } from "../connectionMethods/maybeOneFirst.js";
import { nestedTransaction } from "../connectionMethods/nestedTransaction.js";
import { one } from "../connectionMethods/one.js";
import { oneFirst } from "../connectionMethods/oneFirst.js";
import { query as queryMethod } from "../connectionMethods/query.js";
import { stream } from "../connectionMethods/stream.js";
import type { ConnectionPoolClient } from "../factories/createConnectionPool.js";
import { getPoolClientState } from "../state.js";
import type { PoolClientState } from "../state.js";
import type {
  ClientConfiguration,
  DatabaseTransactionConnection,
  DatabaseTransactionEventEmitter,
  Logger,
} from "../types.js";

class BoundTransactionConnection {
  parentLog: Logger;
  connection: ConnectionPoolClient;
  clientConfiguration: ClientConfiguration;
  transactionDepth: number;
  eventEmitter: DatabaseTransactionEventEmitter;
  transactionId: string;
  private poolClientState: PoolClientState;

  constructor(
    parentLog: Logger,
    connection: ConnectionPoolClient,
    clientConfiguration: ClientConfiguration,
    transactionDepth: number,
    eventEmitter: DatabaseTransactionEventEmitter,
    transactionId: string,
    poolClientState: PoolClientState,
  ) {
    this.parentLog = parentLog;
    this.connection = connection;
    this.clientConfiguration = clientConfiguration;
    this.transactionDepth = transactionDepth;
    this.eventEmitter = eventEmitter;
    this.transactionId = transactionId;
    this.poolClientState = poolClientState;
  }

  private assertTransactionDepth() {
    if (this.transactionDepth !== this.poolClientState.transactionDepth) {
      throw new Error("Cannot run a query using parent transaction.");
    }
  }

  any(slonikSql) {
    this.assertTransactionDepth();
    return any(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  anyFirst(slonikSql) {
    this.assertTransactionDepth();
    return anyFirst(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  exists(slonikSql) {
    this.assertTransactionDepth();
    return exists(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  many(slonikSql) {
    this.assertTransactionDepth();
    return many(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  manyFirst(slonikSql) {
    this.assertTransactionDepth();
    return manyFirst(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  maybeOne(slonikSql) {
    this.assertTransactionDepth();
    return maybeOne(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  maybeOneFirst(slonikSql) {
    this.assertTransactionDepth();
    return maybeOneFirst(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  one(slonikSql) {
    this.assertTransactionDepth();
    return one(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  oneFirst(slonikSql) {
    this.assertTransactionDepth();
    return oneFirst(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  query(slonikSql) {
    this.assertTransactionDepth();
    return queryMethod(this.parentLog, this.connection, this.clientConfiguration, slonikSql);
  }

  stream(slonikSql, streamHandler) {
    this.assertTransactionDepth();
    return stream(
      this.parentLog,
      this.connection,
      this.clientConfiguration,
      slonikSql,
      streamHandler,
    );
  }

  transaction(handler, transactionRetryLimit) {
    this.assertTransactionDepth();
    return nestedTransaction(
      this.parentLog,
      this.connection,
      this.clientConfiguration,
      handler,
      this.transactionDepth,
      transactionRetryLimit,
      this.eventEmitter,
      this.transactionId,
    );
  }

  addListener(event, listener) {
    return this.eventEmitter.addListener(event, listener);
  }
  emit(event, ...args) {
    return this.eventEmitter.emit(event, ...args);
  }
  eventNames() {
    return this.eventEmitter.eventNames();
  }
  getMaxListeners() {
    return this.eventEmitter.getMaxListeners();
  }
  listenerCount(event) {
    return this.eventEmitter.listenerCount(event);
  }
  listeners(event) {
    return this.eventEmitter.listeners(event);
  }
  off(event, listener) {
    return this.eventEmitter.off(event, listener);
  }
  on(event, listener) {
    return this.eventEmitter.on(event, listener);
  }
  once(event, listener) {
    return this.eventEmitter.once(event, listener);
  }
  prependListener(event, listener) {
    return this.eventEmitter.prependListener(event, listener);
  }
  prependOnceListener(event, listener) {
    return this.eventEmitter.prependOnceListener(event, listener);
  }
  rawListeners(event) {
    return this.eventEmitter.rawListeners(event);
  }
  removeAllListeners(event?) {
    return this.eventEmitter.removeAllListeners(event);
  }
  removeListener(event, listener) {
    return this.eventEmitter.removeListener(event, listener);
  }
  setMaxListeners(n) {
    return this.eventEmitter.setMaxListeners(n);
  }
}

export const bindTransactionConnection = (
  parentLog: Logger,
  connection: ConnectionPoolClient,
  clientConfiguration: ClientConfiguration,
  transactionDepth: number,
  eventEmitter: DatabaseTransactionEventEmitter,
  transactionId: string,
): DatabaseTransactionConnection => {
  const poolClientState = getPoolClientState(connection);

  return new BoundTransactionConnection(
    parentLog,
    connection,
    clientConfiguration,
    transactionDepth,
    eventEmitter,
    transactionId,
    poolClientState,
  ) as unknown as DatabaseTransactionConnection;
};
