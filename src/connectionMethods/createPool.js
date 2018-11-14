// @flow

import pg from 'pg';
import serializeError from 'serialize-error';
import {
  parse as parseConnectionString
} from 'pg-connection-string';
import {
  mapTaggedTemplateLiteralInvocation
} from '../utilities';
import type {
  ClientConfigurationType,
  DatabasePoolType,
  DatabaseConfigurationType
} from '../types';
import log from '../Logger';
import any from './any';
import anyFirst from './anyFirst';
import many from './many';
import manyFirst from './manyFirst';
import maybeOne from './maybeOne';
import maybeOneFirst from './maybeOneFirst';
import one from './one';
import oneFirst from './oneFirst';
import query from './query';
import transaction from './transaction';

// @see https://github.com/facebook/flow/issues/2977#issuecomment-390613203
const defaultClientConfiguration = Object.freeze({});

export default (
  connectionConfiguration: DatabaseConfigurationType,
  clientConfiguration: ClientConfigurationType = defaultClientConfiguration
): DatabasePoolType => {
  const pool = new pg.Pool(typeof connectionConfiguration === 'string' ? parseConnectionString(connectionConfiguration) : connectionConfiguration);

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

  const connect = async () => {
    const connection = await pool.connect();

    connection.on('notice', (notice) => {
      log.info({
        notice
      }, 'notice message');
    });

    const bindConnection = {
      any: mapTaggedTemplateLiteralInvocation(any.bind(null, connection, clientConfiguration)),
      anyFirst: mapTaggedTemplateLiteralInvocation(anyFirst.bind(null, connection, clientConfiguration)),
      many: mapTaggedTemplateLiteralInvocation(many.bind(null, connection, clientConfiguration)),
      manyFirst: mapTaggedTemplateLiteralInvocation(manyFirst.bind(null, connection, clientConfiguration)),
      maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, connection, clientConfiguration)),
      maybeOneFirst: mapTaggedTemplateLiteralInvocation(maybeOneFirst.bind(null, connection, clientConfiguration)),
      one: mapTaggedTemplateLiteralInvocation(one.bind(null, connection, clientConfiguration)),
      oneFirst: mapTaggedTemplateLiteralInvocation(oneFirst.bind(null, connection, clientConfiguration)),
      query: mapTaggedTemplateLiteralInvocation(query.bind(null, connection, clientConfiguration)),
      release: connection.release.bind(connection),
      transaction: (handler) => {
        return transaction(bindConnection, handler);
      }
    };

    return bindConnection;
  };

  return {
    any: mapTaggedTemplateLiteralInvocation(any.bind(null, pool, clientConfiguration)),
    anyFirst: mapTaggedTemplateLiteralInvocation(anyFirst.bind(null, pool, clientConfiguration)),
    connect,
    many: mapTaggedTemplateLiteralInvocation(many.bind(null, pool, clientConfiguration)),
    manyFirst: mapTaggedTemplateLiteralInvocation(manyFirst.bind(null, pool, clientConfiguration)),
    maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, pool, clientConfiguration)),
    maybeOneFirst: mapTaggedTemplateLiteralInvocation(maybeOneFirst.bind(null, pool, clientConfiguration)),
    one: mapTaggedTemplateLiteralInvocation(one.bind(null, pool, clientConfiguration)),
    oneFirst: mapTaggedTemplateLiteralInvocation(oneFirst.bind(null, pool, clientConfiguration)),
    query: mapTaggedTemplateLiteralInvocation(query.bind(null, pool, clientConfiguration)),
    transaction: async (handler) => {
      log.debug('allocating a new connection to execute the transaction');

      const connection = await connect();

      let result;

      try {
        result = await connection.transaction(handler);
      } finally {
        log.debug('releasing the connection that was earlier secured to execute a transaction');

        await connection.release();
      }

      return result;
    }
  };
};
