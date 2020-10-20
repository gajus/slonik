// @flow

import {
  assertSqlSqlToken,
} from '../assertions';
import {
  transaction,
} from '../connectionMethods';
import {
  createConnection,
} from '../factories';
import type {
  ClientConfigurationType,
  DatabasePoolType,
  InternalDatabasePoolType,
  LoggerType,
  TaggedTemplateLiteralInvocationType,
} from '../types';

export const bindPool = (
  parentLog: LoggerType,
  pool: InternalDatabasePoolType,
  clientConfiguration: ClientConfigurationType,
): DatabasePoolType => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapConnection = (targetMethodName: string): any => {
    return (query: TaggedTemplateLiteralInvocationType) => {
      if (typeof query === 'string') {
        throw new TypeError('Query must be constructed using `sql` tagged template literal.');
      }

      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (boundConnection as any)[targetMethodName](query);
        },
        (newPool) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (newPool as any)[targetMethodName](query);
        },
        query,
      );
    };
  };

  return {
    any: mapConnection('any'),
    anyFirst: mapConnection('anyFirst'),
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
    copyFromBinary: (copyQuery, values, columnTypes) => {
      assertSqlSqlToken(copyQuery);

      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
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
      const terminateIdleClients = () => {
        const activeConnectionCount = pool.totalCount - pool.idleCount;

        if (activeConnectionCount === 0) {
          for (const client of pool._clients) {
            pool._remove(client);
          }
        }
      };

      pool.slonik.ended = true;

      return new Promise((resolve) => {
        terminateIdleClients();

        pool.on('remove', () => {
          if (pool.totalCount === 0) {
            resolve();
          }
        });

        if (pool.totalCount === 0) {
          resolve();
        }
      });
    },
    exists: mapConnection('exists'),
    getPoolState: () => {
      return {
        activeConnectionCount: pool.totalCount - pool.idleCount,
        ended: pool.slonik.ended,
        idleConnectionCount: pool.idleCount,
        waitingClientCount: pool.waitingCount,
      };
    },
    many: mapConnection('many'),
    manyFirst: mapConnection('manyFirst'),
    maybeOne: mapConnection('maybeOne'),
    maybeOneFirst: mapConnection('maybeOneFirst'),
    one: mapConnection('one'),
    oneFirst: mapConnection('oneFirst'),
    query: mapConnection('query'),
    stream: (streamQuery, streamHandler) => {
      assertSqlSqlToken(streamQuery);

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
    transaction: async (transactionHandler) => {
      return createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_TRANSACTION',
        (connectionLog, connection) => {
          return transaction(connectionLog, connection, clientConfiguration, transactionHandler);
        },
        (newPool) => {
          return newPool.transaction(transactionHandler);
        },
      );
    },
  };
};
