import { transaction } from '../connectionMethods/transaction.js';
import { createConnection } from '../factories/createConnection.js';
import type { ConnectionPool } from '../factories/createConnectionPool.js';
import type {
  ClientConfiguration,
  DatabasePool,
  DatabasePoolEventEmitter,
  Logger,
} from '../types.js';

export const bindPool = (
  events: DatabasePoolEventEmitter,
  parentLog: Logger,
  pool: ConnectionPool,
  clientConfiguration: ClientConfiguration,
): DatabasePool => {
  const boundPool = {
    any: (query) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
          return boundConnection.any(query);
        },
        (newPool) => {
          return newPool.any(query);
        },
        query,
      );
    },
    anyFirst: (query) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
          return boundConnection.anyFirst(query);
        },
        (newPool) => {
          return newPool.anyFirst(query);
        },
        query,
      );
    },
    configuration: clientConfiguration,
    connect: (connectionHandler) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'EXPLICIT',
        (connectionLog, connection, boundConnection) => {
          return connectionHandler(boundConnection);
        },
        (newPool) => {
          return newPool.connect(connectionHandler);
        },
      );
    },
    end: async () => {
      await pool.end();
    },
    exists: (query) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
          return boundConnection.exists(query);
        },
        (newPool) => {
          return newPool.exists(query);
        },
        query,
      );
    },
    many: (query) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
          return boundConnection.many(query);
        },
        (newPool) => {
          return newPool.many(query);
        },
        query,
      );
    },
    manyFirst: (query) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
          return boundConnection.manyFirst(query);
        },
        (newPool) => {
          return newPool.manyFirst(query);
        },
        query,
      );
    },
    maybeOne: (query) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
          return boundConnection.maybeOne(query);
        },
        (newPool) => {
          return newPool.maybeOne(query);
        },
        query,
      );
    },
    maybeOneFirst: (query) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
          return boundConnection.maybeOneFirst(query);
        },
        (newPool) => {
          return newPool.maybeOneFirst(query);
        },
        query,
      );
    },
    one: (query) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
          return boundConnection.one(query);
        },
        (newPool) => {
          return newPool.one(query);
        },
        query,
      );
    },
    oneFirst: (query) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
          return boundConnection.oneFirst(query);
        },
        (newPool) => {
          return newPool.oneFirst(query);
        },
        query,
      );
    },
    query: (query) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
          return boundConnection.query(query);
        },
        (newPool) => {
          return newPool.query(query);
        },
        query,
      );
    },
    state: () => {
      return pool.state();
    },
    stream: (streamQuery, streamHandler) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
          return boundConnection.stream(streamQuery, streamHandler);
        },
        (newPool) => {
          return newPool.stream(streamQuery, streamHandler);
        },
        streamQuery,
      );
    },
    transaction: (transactionHandler, transactionRetryLimit) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_TRANSACTION',
        (connectionLog, connection) => {
          return transaction(
            connectionLog,
            connection,
            clientConfiguration,
            transactionHandler,
            transactionRetryLimit,
          );
        },
        (newPool) => {
          return newPool.transaction(transactionHandler);
        },
      );
    },
    ...events,
  };

  Object.setPrototypeOf(boundPool, events);

  return boundPool;
};
