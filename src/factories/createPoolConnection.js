// @flow

import {
  createUlid,
  mapTaggedTemplateLiteralInvocation
} from '../utilities';
import {
  any,
  anyFirst,
  many,
  manyFirst,
  maybeOne,
  maybeOneFirst,
  one,
  oneFirst,
  query,
  transaction
} from '../connectionMethods';
import type {
  ClientConfigurationType,
  DatabasePoolConnectionType,
  InternalDatabaseConnectionType,
  LoggerType
} from '../types';

export default (log: LoggerType, connection: InternalDatabaseConnectionType, clientConfiguration: ClientConfigurationType): DatabasePoolConnectionType => {
  const connectionLog = log.child({
    connectionId: createUlid()
  });

  connection.on('notice', (notice) => {
    connectionLog.info({
      notice
    }, 'notice message');
  });

  const boundConnection = {
    any: mapTaggedTemplateLiteralInvocation(any.bind(null, connectionLog, connection, clientConfiguration)),
    anyFirst: mapTaggedTemplateLiteralInvocation(anyFirst.bind(null, connectionLog, connection, clientConfiguration)),
    many: mapTaggedTemplateLiteralInvocation(many.bind(null, connectionLog, connection, clientConfiguration)),
    manyFirst: mapTaggedTemplateLiteralInvocation(manyFirst.bind(null, connectionLog, connection, clientConfiguration)),
    maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, connectionLog, connection, clientConfiguration)),
    maybeOneFirst: mapTaggedTemplateLiteralInvocation(maybeOneFirst.bind(null, connectionLog, connection, clientConfiguration)),
    one: mapTaggedTemplateLiteralInvocation(one.bind(null, connectionLog, connection, clientConfiguration)),
    oneFirst: mapTaggedTemplateLiteralInvocation(oneFirst.bind(null, connectionLog, connection, clientConfiguration)),
    query: mapTaggedTemplateLiteralInvocation(query.bind(null, connectionLog, connection, clientConfiguration)),
    release: connection.release.bind(connection),
    transaction: (transactionHandler) => {
      const transactionLog = connectionLog.child({
        connectionId: createUlid()
      });

      return transaction(transactionLog, boundConnection, transactionHandler);
    }
  };

  return boundConnection;
};
