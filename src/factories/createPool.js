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
import {
  any,
  anyFirst,
  many,
  manyFirst,
  maybeOne,
  maybeOneFirst,
  one,
  oneFirst,
  query
} from '../connectionMethods';
import createPoolConnection from './createPoolConnection';

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
    const connection = await pool.connect();

    return createPoolConnection(poolLog, connection, clientConfiguration);
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
