// @flow

import type {
  ClientConfigurationType,
  DatabasePoolType,
  InternalDatabasePoolType,
  LoggerType,
  StreamHandlerType,
  TaggedTemplateLiteralInvocationType
} from '../types';
import {
  createConnection
} from '../factories';
import {
  transaction
} from '../connectionMethods';

export default (
  parentLog: LoggerType,
  pool: InternalDatabasePoolType,
  clientConfiguration: ClientConfigurationType
): DatabasePoolType => {
  const mapConnection = (targetMethodName: string) => {
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
          return boundConnection[targetMethodName](query);
        },
        (newPool) => {
          return newPool[targetMethodName](query);
        },
        query
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
        }
      );
    },
    many: mapConnection('many'),
    manyFirst: mapConnection('manyFirst'),
    maybeOne: mapConnection('maybeOne'),
    maybeOneFirst: mapConnection('maybeOneFirst'),
    one: mapConnection('one'),
    oneFirst: mapConnection('oneFirst'),
    query: mapConnection('query'),
    stream: async (query: TaggedTemplateLiteralInvocationType, streamHandler: StreamHandlerType) => {
      if (typeof query === 'string') {
        throw new TypeError('Query must be constructed using `sql` tagged template literal.');
      }

      await createConnection(
        parentLog,
        pool,
        clientConfiguration,
        'IMPLICIT_QUERY',
        (connectionLog, connection, boundConnection) => {
          return boundConnection.stream(query, streamHandler);
        },
        (newPool) => {
          return newPool.stream(query, streamHandler);
        },
        query
      );

      return null;
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
        }
      );
    }
  };
};
