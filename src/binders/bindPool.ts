import type {
  Pool as PgPool,
} from 'pg';
import {
  assertSqlSqlToken,
} from '../assertions';
import {
  transaction,
} from '../connectionMethods';
import {
  createConnection,
} from '../factories';
import {
  getPoolState,
} from '../state';
import type {
  ClientConfiguration,
  DatabasePool,
  Logger,
  TaggedTemplateLiteralInvocation,
} from '../types';

export const bindPool = (
  parentLog: Logger,
  pool: PgPool,
  clientConfiguration: ClientConfiguration,
): DatabasePool => {
  return {
    any: (query: TaggedTemplateLiteralInvocation) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (
          connectionLog,
          connection,
          boundConnection,
        ) => {
          return boundConnection.any(query);
        },
        (newPool) => {
          return newPool.any(query);
        },
        query,
      );
    },
    anyFirst: (query: TaggedTemplateLiteralInvocation) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (
          connectionLog,
          connection,
          boundConnection,
        ) => {
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
        (
          connectionLog,
          connection,
          boundConnection,
        ) => {
          return connectionHandler(boundConnection);
        },
        (newPool) => {
          return newPool.connect(connectionHandler);
        },
      );
    },
    copyFromBinary: (copyQuery, values, columnTypes) => {
      assertSqlSqlToken(copyQuery);

      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (
          connectionLog,
          connection,
          boundConnection,
        ) => {
          return boundConnection.copyFromBinary(
            copyQuery,
            values,
            columnTypes,
          );
        },
        (newPool) => {
          return newPool.copyFromBinary(
            copyQuery,
            values,
            columnTypes,
          );
        },
      );
    },
    end: async () => {
      const poolState = getPoolState(pool);

      const terminateIdleClients = () => {
        const activeConnectionCount = pool.totalCount - pool.idleCount;

        if (activeConnectionCount === 0) {
          for (const client of pool._clients) {
            pool._remove(client);
          }
        }
      };

      poolState.ended = true;

      await new Promise((resolve) => {
        terminateIdleClients();

        pool.on('remove', () => {
          if (pool.totalCount === 0) {
            resolve(undefined);
          }
        });

        if (pool.totalCount === 0) {
          resolve(undefined);
        }
      });
    },
    exists: (query: TaggedTemplateLiteralInvocation) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (
          connectionLog,
          connection,
          boundConnection,
        ) => {
          return boundConnection.exists(query);
        },
        (newPool) => {
          return newPool.exists(query);
        },
        query,
      );
    },
    getPoolState: () => {
      const poolState = getPoolState(pool);

      return {
        activeConnectionCount: pool.totalCount - pool.idleCount,
        ended: poolState.ended,
        idleConnectionCount: pool.idleCount,
        waitingClientCount: pool.waitingCount,
      };
    },
    many: (query: TaggedTemplateLiteralInvocation) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (
          connectionLog,
          connection,
          boundConnection,
        ) => {
          return boundConnection.many(query);
        },
        (newPool) => {
          return newPool.many(query);
        },
        query,
      );
    },
    manyFirst: (query: TaggedTemplateLiteralInvocation) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (
          connectionLog,
          connection,
          boundConnection,
        ) => {
          return boundConnection.manyFirst(query);
        },
        (newPool) => {
          return newPool.manyFirst(query);
        },
        query,
      );
    },
    maybeOne: (query: TaggedTemplateLiteralInvocation) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (
          connectionLog,
          connection,
          boundConnection,
        ) => {
          return boundConnection.maybeOne(query);
        },
        (newPool) => {
          return newPool.maybeOne(query);
        },
        query,
      );
    },
    maybeOneFirst: (query: TaggedTemplateLiteralInvocation) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (
          connectionLog,
          connection,
          boundConnection,
        ) => {
          return boundConnection.maybeOneFirst(query);
        },
        (newPool) => {
          return newPool.maybeOneFirst(query);
        },
        query,
      );
    },
    one: (query: TaggedTemplateLiteralInvocation) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (
          connectionLog,
          connection,
          boundConnection,
        ) => {
          return boundConnection.one(query);
        },
        (newPool) => {
          return newPool.one(query);
        },
        query,
      );
    },
    oneFirst: (query: TaggedTemplateLiteralInvocation) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (
          connectionLog,
          connection,
          boundConnection,
        ) => {
          return boundConnection.oneFirst(query);
        },
        (newPool) => {
          return newPool.oneFirst(query);
        },
        query,
      );
    },
    query: (query: TaggedTemplateLiteralInvocation) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (
          connectionLog,
          connection,
          boundConnection,
        ) => {
          return boundConnection.query(query);
        },
        (newPool) => {
          return newPool.query(query);
        },
        query,
      );
    },
    stream: (streamQuery, streamHandler, config) => {
      assertSqlSqlToken(streamQuery);

      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (
          connectionLog,
          connection,
          boundConnection,
        ) => {
          return boundConnection.stream(streamQuery, streamHandler, config);
        },
        (newPool) => {
          return newPool.stream(streamQuery, streamHandler, config);
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
        (connectionLog, connection) => {
          return transaction(connectionLog, connection, clientConfiguration, transactionHandler, transactionRetryLimit);
        },
        (newPool) => {
          return newPool.transaction(transactionHandler);
        },
      );
    },
  };
};
