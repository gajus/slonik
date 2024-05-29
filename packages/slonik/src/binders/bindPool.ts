import { transaction } from '../connectionMethods/transaction';
import { createConnection } from '../factories/createConnection';
import { type ConnectionPool } from '../factories/createConnectionPool';
import {
  type ClientConfiguration,
  type DatabasePool,
  type Logger,
} from '../types';

export const bindPool = (
  parentLog: Logger,
  pool: ConnectionPool,
  clientConfiguration: ClientConfiguration,
): DatabasePool => {
  return {
    any: async (query) => {
      return await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        async (connectionLog, connection, boundConnection) => {
          return await boundConnection.any(query);
        },
        async (newPool) => {
          return await newPool.any(query);
        },
        query,
      );
    },
    anyFirst: async (query) => {
      return await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        async (connectionLog, connection, boundConnection) => {
          return await boundConnection.anyFirst(query);
        },
        async (newPool) => {
          return await newPool.anyFirst(query);
        },
        query,
      );
    },
    configuration: clientConfiguration,
    connect: async (connectionHandler) => {
      return await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'EXPLICIT',
        async (connectionLog, connection, boundConnection) => {
          return await connectionHandler(boundConnection);
        },
        async (newPool) => {
          return await newPool.connect(connectionHandler);
        },
      );
    },
    end: async () => {
      await pool.end();
    },
    exists: async (query) => {
      return await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        async (connectionLog, connection, boundConnection) => {
          return await boundConnection.exists(query);
        },
        async (newPool) => {
          return await newPool.exists(query);
        },
        query,
      );
    },
    many: async (query) => {
      return await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        async (connectionLog, connection, boundConnection) => {
          return await boundConnection.many(query);
        },
        async (newPool) => {
          return await newPool.many(query);
        },
        query,
      );
    },
    manyFirst: async (query) => {
      return await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        async (connectionLog, connection, boundConnection) => {
          return await boundConnection.manyFirst(query);
        },
        async (newPool) => {
          return await newPool.manyFirst(query);
        },
        query,
      );
    },
    maybeOne: async (query) => {
      return await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        async (connectionLog, connection, boundConnection) => {
          return await boundConnection.maybeOne(query);
        },
        async (newPool) => {
          return await newPool.maybeOne(query);
        },
        query,
      );
    },
    maybeOneFirst: async (query) => {
      return await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        async (connectionLog, connection, boundConnection) => {
          return await boundConnection.maybeOneFirst(query);
        },
        async (newPool) => {
          return await newPool.maybeOneFirst(query);
        },
        query,
      );
    },
    one: async (query) => {
      return await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        async (connectionLog, connection, boundConnection) => {
          return await boundConnection.one(query);
        },
        async (newPool) => {
          return await newPool.one(query);
        },
        query,
      );
    },
    oneFirst: async (query) => {
      return await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        async (connectionLog, connection, boundConnection) => {
          return await boundConnection.oneFirst(query);
        },
        async (newPool) => {
          return await newPool.oneFirst(query);
        },
        query,
      );
    },
    query: async (query) => {
      return await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        async (connectionLog, connection, boundConnection) => {
          return await boundConnection.query(query);
        },
        async (newPool) => {
          return await newPool.query(query);
        },
        query,
      );
    },
    state: () => {
      return pool.state();
    },
    stream: async (streamQuery, streamHandler) => {
      return await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        async (connectionLog, connection, boundConnection) => {
          return await boundConnection.stream(streamQuery, streamHandler);
        },
        async (newPool) => {
          return await newPool.stream(streamQuery, streamHandler);
        },
        streamQuery,
      );
    },
    transaction: async (transactionHandler, transactionRetryLimit) => {
      return await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_TRANSACTION',
        async (connectionLog, connection) => {
          return await transaction(
            connectionLog,
            connection,
            clientConfiguration,
            transactionHandler,
            transactionRetryLimit,
          );
        },
        async (newPool) => {
          return await newPool.transaction(transactionHandler);
        },
      );
    },
  };
};
