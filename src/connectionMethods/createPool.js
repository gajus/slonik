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
  DatabasePoolType,
  DatabaseConfigurationType
} from '../types';
import Logger from '../Logger';
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
  const poolLog = Logger.child({
    poolId: createUlid()
  });

  const pool = new pg.Pool(typeof connectionConfiguration === 'string' ? parseConnectionString(connectionConfiguration) : connectionConfiguration);

  pool.on('error', (error) => {
    poolLog.error({
      error: serializeError(error)
    }, 'client connection error');
  });

  pool.on('connect', (client) => {
    poolLog.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'created a new client connection');
  });

  pool.on('acquire', (client) => {
    poolLog.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'client is checked out from the pool');
  });

  pool.on('remove', (client) => {
    poolLog.info({
      processId: client.processID,
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount
      }
    }, 'client connection is closed and removed from the client pool');
  });

  const connect = async () => {
    const connectionLog = poolLog.child({
      connectionId: createUlid()
    });

    const connection = await pool.connect();

    connection.on('notice', (notice) => {
      connectionLog.info({
        notice
      }, 'notice message');
    });

    const bindConnection = {
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
      transaction: (handler) => {
        const transactionLog = poolLog.child({
          connectionId: createUlid()
        });

        return transaction(transactionLog, bindConnection, handler);
      }
    };

    return bindConnection;
  };

  return {
    any: mapTaggedTemplateLiteralInvocation(any.bind(null, poolLog, pool, clientConfiguration)),
    anyFirst: mapTaggedTemplateLiteralInvocation(anyFirst.bind(null, poolLog, pool, clientConfiguration)),
    connect,
    many: mapTaggedTemplateLiteralInvocation(many.bind(null, poolLog, pool, clientConfiguration)),
    manyFirst: mapTaggedTemplateLiteralInvocation(manyFirst.bind(null, poolLog, pool, clientConfiguration)),
    maybeOne: mapTaggedTemplateLiteralInvocation(maybeOne.bind(null, poolLog, pool, clientConfiguration)),
    maybeOneFirst: mapTaggedTemplateLiteralInvocation(maybeOneFirst.bind(null, poolLog, pool, clientConfiguration)),
    one: mapTaggedTemplateLiteralInvocation(one.bind(null, poolLog, pool, clientConfiguration)),
    oneFirst: mapTaggedTemplateLiteralInvocation(oneFirst.bind(null, poolLog, pool, clientConfiguration)),
    query: mapTaggedTemplateLiteralInvocation(query.bind(null, poolLog, pool, clientConfiguration)),
    transaction: async (handler) => {
      poolLog.debug('allocating a new connection to execute the transaction');

      const connection = await connect();

      let result;

      try {
        result = await connection.transaction(handler);
      } finally {
        poolLog.debug('releasing the connection that was earlier secured to execute a transaction');

        await connection.release();
      }

      return result;
    }
  };
};
