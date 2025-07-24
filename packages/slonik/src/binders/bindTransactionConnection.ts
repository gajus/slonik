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
  DatabaseTransactionEventEmitter,
  Logger,
} from '../types.js';

export const bindTransactionConnection = (
  parentLog: Logger,
  connection: ConnectionPoolClient,
  clientConfiguration: ClientConfiguration,
  transactionDepth: number,
  eventEmitter: DatabaseTransactionEventEmitter,
  transactionId: string,
): DatabaseTransactionConnection => {
  const poolClientState = getPoolClientState(connection);

  const assertTransactionDepth = () => {
    if (transactionDepth !== poolClientState.transactionDepth) {
      throw new Error('Cannot run a query using parent transaction.');
    }
  };

  return {
    addListener: eventEmitter.addListener.bind(eventEmitter),
    any: (slonikSql) => {
      assertTransactionDepth();

      return any(parentLog, connection, clientConfiguration, slonikSql);
    },
    anyFirst: (slonikSql) => {
      assertTransactionDepth();

      return anyFirst(parentLog, connection, clientConfiguration, slonikSql);
    },
    emit: eventEmitter.emit.bind(eventEmitter),
    eventNames: eventEmitter.eventNames.bind(eventEmitter),
    exists: async (slonikSql) => {
      assertTransactionDepth();

      return await exists(
        parentLog,
        connection,
        clientConfiguration,
        slonikSql,
      );
    },
    getMaxListeners: eventEmitter.getMaxListeners.bind(eventEmitter),
    listenerCount: eventEmitter.listenerCount.bind(eventEmitter),
    listeners: eventEmitter.listeners.bind(eventEmitter),
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
    off: eventEmitter.off.bind(eventEmitter),
    on: eventEmitter.on.bind(eventEmitter),
    once: eventEmitter.once.bind(eventEmitter),
    one: (slonikSql) => {
      assertTransactionDepth();

      return one(parentLog, connection, clientConfiguration, slonikSql);
    },
    oneFirst: (slonikSql) => {
      assertTransactionDepth();

      return oneFirst(parentLog, connection, clientConfiguration, slonikSql);
    },
    prependListener: eventEmitter.prependListener.bind(eventEmitter),
    prependOnceListener: eventEmitter.prependOnceListener.bind(eventEmitter),
    query: (slonikSql) => {
      assertTransactionDepth();

      return queryMethod(parentLog, connection, clientConfiguration, slonikSql);
    },
    rawListeners: eventEmitter.rawListeners.bind(eventEmitter),
    removeAllListeners: eventEmitter.removeAllListeners.bind(eventEmitter),
    removeListener: eventEmitter.removeListener.bind(eventEmitter),
    setMaxListeners: eventEmitter.setMaxListeners.bind(eventEmitter),
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
        eventEmitter,
        transactionId,
      );
    },
    transactionDepth,
    transactionId,
  };
};
