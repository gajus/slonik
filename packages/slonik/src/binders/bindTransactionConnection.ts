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

  addListener(...args) {
    return this.eventEmitter.addListener(...args);
  }
  emit(...args) {
    return this.eventEmitter.emit(...args);
  }
  eventNames() {
    return this.eventEmitter.eventNames();
  }
  getMaxListeners() {
    return this.eventEmitter.getMaxListeners();
  }
  listenerCount(...args) {
    return this.eventEmitter.listenerCount(...args);
  }
  listeners(...args) {
    return this.eventEmitter.listeners(...args);
  }
  off(...args) {
    return this.eventEmitter.off(...args);
  }
  on(...args) {
    return this.eventEmitter.on(...args);
  }
  once(...args) {
    return this.eventEmitter.once(...args);
  }
  prependListener(...args) {
    return this.eventEmitter.prependListener(...args);
  }
  prependOnceListener(...args) {
    return this.eventEmitter.prependOnceListener(...args);
  }
  rawListeners(...args) {
    return this.eventEmitter.rawListeners(...args);
  }
  removeAllListeners(...args) {
    return this.eventEmitter.removeAllListeners(...args);
  }
  removeListener(...args) {
    return this.eventEmitter.removeListener(...args);
  }
  setMaxListeners(...args) {
    return this.eventEmitter.setMaxListeners(...args);
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
