// @flow

import pg from 'pg';
import serializeError from 'serialize-error';
import {
  parse as parseConnectionString
} from 'pg-connection-string';
import {
  createUlid,
  mapTaggedTemplateLiteralInvocation
} from '../utilities';
import type {
  ClientConfigurationType,
  DatabaseConfigurationType,
  DatabaseSingleConnectionType
} from '../types';
import Logger from '../Logger';
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

// @see https://github.com/facebook/flow/issues/2977#issuecomment-390613203
const defaultClientConfiguration = Object.freeze({});

export default async (
  connectionConfiguration: DatabaseConfigurationType,
  clientConfiguration: ClientConfigurationType = defaultClientConfiguration
): Promise<DatabaseSingleConnectionType> => {
  const pool = new pg.Pool(typeof connectionConfiguration === 'string' ? parseConnectionString(connectionConfiguration) : connectionConfiguration);

  const log = Logger.child({
    connectionId: createUlid()
  });

  pool.on('error', (error) => {
    log.error({
      error: serializeError(error)
    }, 'client connection error');
  });

  pool.on('connect', (client) => {
    log.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'created a new client connection');
  });

  pool.on('acquire', (client) => {
    log.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'client is checked out from the pool');
  });

  pool.on('remove', (client) => {
    log.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'client connection is closed and removed from the client pool');
  });

  const connection = await pool.connect();

  connection.on('notice', (notice) => {
    log.info({
      notice
    }, 'notice message');
  });

  let ended = false;

  const bindConnection = {
    any: mapTaggedTemplateLiteralInvocation(any.bind(null, log, connection, clientConfiguration)),
    anyFirst: mapTaggedTemplateLiteralInvocation(anyFirst.bind(null, log, connection, clientConfiguration)),
    end: async () => {
      if (ended) {
        return ended;
      }

      await connection.release();

      ended = pool.end();

      return ended;
    },
    many: mapTaggedTemplateLiteralInvocation(many.bind(null, log, connection, clientConfiguration)),
    manyFirst: mapTaggedTemplateLiteralInvocation(manyFirst.bind(null, log, connection, clientConfiguration)),
    maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, log, connection, clientConfiguration)),
    maybeOneFirst: mapTaggedTemplateLiteralInvocation(maybeOneFirst.bind(null, log, connection, clientConfiguration)),
    one: mapTaggedTemplateLiteralInvocation(one.bind(null, log, connection, clientConfiguration)),
    oneFirst: mapTaggedTemplateLiteralInvocation(oneFirst.bind(null, log, connection, clientConfiguration)),
    query: mapTaggedTemplateLiteralInvocation(query.bind(null, log, connection, clientConfiguration)),
    transaction: (handler) => {
      const transactionLog = log.child({
        transactionId: createUlid()
      });

      return transaction(transactionLog, bindConnection, handler);
    }
  };

  return bindConnection;
};
